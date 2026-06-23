import { useState, useEffect, useCallback } from 'react';
import { useLoaderData } from 'react-router';
import { supabase as browserSupabase } from '../lib/supabase/client';
import { 
  Plus, Edit2, Trash2, Loader2, Image as ImageIcon, 
  AlertCircle, FolderPlus, Utensils, Tag, Info, Check, Sparkles, Move, X, Copy,
  Upload, Download
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '../lib/supabase/server';
import Logo from '../components/logo';

export async function loader({ request }) {
  const supabase = await createClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    throw new Response("Restaurant profile not found", { status: 404 });
  }

  // Fetch categories ordered by order_index
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', profile.id)
    .order('order_index', { ascending: true });

  // Fetch menu items ordered by order_index
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', profile.id)
    .order('order_index', { ascending: true });

  return { 
    profile, 
    initialCategories: categories || [], 
    initialMenuItems: menuItems || [] 
  };
}


export default function MenuBuilder() {
  const { profile, initialCategories, initialMenuItems } = useLoaderData();

  const [categories, setCategories] = useState(initialCategories);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  // Loading states
  const [loading] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);
  
  // Stackable toasts
  const [toasts, setToasts] = useState([]);
  
  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('add'); // 'add' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalMode, setItemModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  
  // Menu Item form state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemAllergens, setItemAllergens] = useState([]);
  const [itemBadge, setItemBadge] = useState('');
  
  // Translation fields
  const [categoryNameAr, setCategoryNameAr] = useState('');
  const [itemNameAr, setItemNameAr] = useState('');
  const [itemDescriptionAr, setItemDescriptionAr] = useState('');

  // Drag states
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const allergenOptions = ['Gluten', 'Nuts', 'Dairy', 'Vegan', 'Vegetarian', 'Spicy', 'Seafood'];

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((type, text) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const handleAutoFetchImages = async () => {
    const itemsWithoutImages = menuItems.filter(item => !item.image_url || item.image_url.trim() === '');
    if (itemsWithoutImages.length === 0) {
      showNotification('success', 'All menu items already have images!');
      return;
    }

    setFetchingImages(true);
    try {
      const response = await fetch('/api/auto-fetch-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'auto-fetch-images' }),
      });
      
      const result = await response.json();
      if (result.success) {
        if (result.count > 0) {
          showNotification('success', `Successfully fetched and updated ${result.count} images! (Max 10 per click to prevent timeouts/limits)`);
          if (result.updatedItems && result.updatedItems.length > 0) {
            setMenuItems(prev => prev.map(item => {
              const updated = result.updatedItems.find(u => u.id === item.id);
              return updated ? { ...item, image_url: updated.image_url } : item;
            }));
          }
        } else {
          showNotification('success', 'No images found or all items are already processed.');
        }
      } else {
        showNotification('error', result.error || 'Failed to fetch images');
      }
    } catch (err) {
      showNotification('error', `Error fetching images: ${err.message}`);
    } finally {
      setFetchingImages(false);
    }
  };

  // Set default selected category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // CATEGORY DRAG AND DROP HANDLERS
  const handleCategoryDragStart = (index) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
  };

  const handleCategoryDrop = async (index) => {
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;

    const newCategories = [...categories];
    const draggedCat = newCategories[draggedCategoryIndex];
    newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(index, 0, draggedCat);

    setCategories(newCategories);

    try {
      const updates = newCategories.map((c, idx) => ({
        id: c.id,
        restaurant_id: profile.id,
        name: c.name,
        name_ar: c.name_ar,
        order_index: idx,
      }));

      const { error } = await browserSupabase.from('categories').upsert(updates);
      if (error) throw error;
      showNotification('success', 'Category order updated in real time!');
    } catch (error) {
      showNotification('error', `Could not save order: ${error.message}`);
    } finally {
      setDraggedCategoryIndex(null);
    }
  };

  // MENU ITEM DRAG AND DROP HANDLERS
  const handleItemDragStart = (index) => {
    setDraggedItemIndex(index);
  };

  const handleItemDragOver = (e) => {
    e.preventDefault();
  };

  const handleItemDrop = async (index) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const currentCatItems = [...activeItems];
    const draggedItem = currentCatItems[draggedItemIndex];
    currentCatItems.splice(draggedItemIndex, 1);
    currentCatItems.splice(index, 0, draggedItem);

    const otherItems = menuItems.filter(item => item.category_id !== selectedCategoryId);
    const updatedItemsList = [
      ...currentCatItems.map((item, idx) => ({ ...item, order_index: idx })),
      ...otherItems
    ];

    setMenuItems(updatedItemsList);

    try {
      const updates = currentCatItems.map((item, idx) => ({
        id: item.id,
        category_id: item.category_id,
        restaurant_id: profile.id,
        name: item.name,
        name_ar: item.name_ar,
        description: item.description,
        description_ar: item.description_ar,
        price: item.price,
        image_url: item.image_url,
        available: item.available,
        allergens: item.allergens,
        badge: item.badge || null,
        order_index: idx,
      }));

      const { error } = await browserSupabase.from('menu_items').upsert(updates);
      if (error) throw error;
      showNotification('success', 'Item order updated in real time!');
    } catch (error) {
      showNotification('error', `Could not save order: ${error.message}`);
    } finally {
      setDraggedItemIndex(null);
    }
  };

  // CATEGORY CRUD ACTIONS
  const openAddCategory = () => {
    setCategoryModalMode('add');
    setCategoryName('');
    setCategoryNameAr('');
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setCategoryModalMode('edit');
    setCategoryName(cat.name);
    setCategoryNameAr(cat.name_ar || '');
    setEditingCategory(cat);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || !profile) return;
    setSubmittingCategory(true);

    try {
      if (categoryModalMode === 'add') {
        const { data, error } = await browserSupabase
          .from('categories')
          .insert({
            restaurant_id: profile.id,
            name: categoryName,
            name_ar: categoryNameAr || null,
            order_index: categories.length,
          })
          .select()
          .single();

        if (error) throw error;
        setCategories([...categories, data]);
        if (!selectedCategoryId) setSelectedCategoryId(data.id);
        showNotification('success', 'Category added successfully!');
      } else {
        const { error } = await browserSupabase
          .from('categories')
          .update({ 
            name: categoryName,
            name_ar: categoryNameAr || null
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: categoryName, name_ar: categoryNameAr || null } : c));
        showNotification('success', 'Category updated successfully!');
      }
      setShowCategoryModal(false);
    } catch (error) {
      showNotification('error', error.message);
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? All items inside will be deleted too.')) return;

    try {
      const { error } = await browserSupabase.from('categories').delete().eq('id', catId);
      if (error) throw error;

      const updatedCats = categories.filter(c => c.id !== catId);
      setCategories(updatedCats);
      setMenuItems(menuItems.filter(item => item.category_id !== catId));

      if (selectedCategoryId === catId) {
        setSelectedCategoryId(updatedCats.length > 0 ? updatedCats[0].id : '');
      }
      showNotification('success', 'Category deleted successfully!');
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  // MENU ITEM CRUD ACTIONS
  const openAddItem = () => {
    setItemModalMode('add');
    setEditingItem(null);
    setItemName('');
    setItemNameAr('');
    setItemDescription('');
    setItemDescriptionAr('');
    setItemPrice('');
    setItemCategoryId(selectedCategoryId || (categories[0]?.id || ''));
    setItemImageUrl('');
    setItemIsAvailable(true);
    setItemAllergens([]);
    setItemBadge('');
    setShowItemModal(true);
  };

  const openEditItem = (item) => {
    setItemModalMode('edit');
    setEditingItem(item);
    setItemName(item.name);
    setItemNameAr(item.name_ar || '');
    setItemDescription(item.description || '');
    setItemDescriptionAr(item.description_ar || '');
    setItemPrice(item.price.toString());
    setItemCategoryId(item.category_id);
    setItemImageUrl(item.image_url || '');
    setItemIsAvailable(item.available);
    setItemAllergens(item.allergens || []);
    setItemBadge(item.badge || '');
    setShowItemModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await browserSupabase.storage
         .from('menu-images')
         .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = browserSupabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setItemImageUrl(publicUrl);
      showNotification('success', 'Item image uploaded and compressed!');
    } catch (error) {
      showNotification('error', `Image upload failed: ${error.message}. Please verify the 'menu-images' bucket exists in your Supabase storage.`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice || !itemCategoryId || !profile) return;
    setSubmittingItem(true);

    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum)) {
      showNotification('error', 'Please enter a valid price.');
      setSubmittingItem(false);
      return;
    }

    const currentCatItems = menuItems.filter(item => item.category_id === itemCategoryId);

    const itemData = {
      restaurant_id: profile.id,
      category_id: itemCategoryId,
      name: itemName,
      name_ar: itemNameAr || null,
      description: itemDescription,
      description_ar: itemDescriptionAr || null,
      price: priceNum,
      image_url: itemImageUrl,
      available: itemIsAvailable,
      allergens: itemAllergens,
      badge: itemBadge || null,
      order_index: itemModalMode === 'add' ? currentCatItems.length : editingItem.order_index,
    };

    try {
      if (itemModalMode === 'add') {
        const { data, error } = await browserSupabase
          .from('menu_items')
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        setMenuItems([...menuItems, data]);
        showNotification('success', 'Menu item added successfully!');
      } else {
        const { error } = await browserSupabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        setMenuItems(menuItems.map(item => item.id === editingItem.id ? { ...item, ...itemData } : item));
        showNotification('success', 'Menu item updated successfully!');
      }
      setShowItemModal(false);
    } catch (error) {
      showNotification('error', error.message);
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const { error } = await browserSupabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;

      setMenuItems(menuItems.filter(item => item.id !== itemId));
      showNotification('success', 'Menu item deleted successfully!');
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  const handleDuplicateItem = (item) => {
    setItemModalMode('add');
    setEditingItem(null);
    setItemName(`${item.name} (Copy)`);
    setItemNameAr(item.name_ar ? `${item.name_ar} (نسخة)` : '');
    setItemDescription(item.description || '');
    setItemDescriptionAr(item.description_ar || '');
    setItemPrice(item.price.toString());
    setItemCategoryId(item.category_id);
    setItemImageUrl(item.image_url || '');
    setItemIsAvailable(item.available);
    setItemAllergens(item.allergens || []);
    setItemBadge(item.badge || '');
    setShowItemModal(true);
  };

  const handleToggleAvailability = async (item) => {
    const newStatus = !item.available;
    try {
      setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, available: newStatus } : i));

      const { error } = await browserSupabase
        .from('menu_items')
        .update({ available: newStatus })
        .eq('id', item.id);

      if (error) throw error;
    } catch (error) {
      showNotification('error', `Could not update status: ${error.message}`);
      setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, available: item.available } : i));
    }
  };

  const handleAllergenToggle = (allergen) => {
    if (itemAllergens.includes(allergen)) {
      setItemAllergens(itemAllergens.filter(a => a !== allergen));
    } else {
      setItemAllergens([...itemAllergens, allergen]);
    }
  };

  const parseCSV = (csvText) => {
    const firstLine = csvText.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const separator = commaCount >= semiCount ? ',' : ';';

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === separator) {
          currentRow.push(currentField.trim());
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          currentRow.push(currentField.trim());
          if (currentRow.some(field => field !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field !== '')) {
        rows.push(currentRow);
      }
    }
    return rows;
  };

  const downloadCSVTemplate = () => {
    const headers = ['Category', 'Category_AR', 'Name', 'Name_AR', 'Description', 'Description_AR', 'Price', 'Available', 'Allergens', 'Badge'];
    const rows = [
      ['Starters', 'المقبلات', 'Truffle Fries', 'بطاطس بالتروفل', 'Crispy fries with truffle oil and parmesan', 'بطاطس مقلية مقرمشة بزيت الترفل والبارميزان', '8.50', 'true', 'Dairy,Gluten', 'bestseller'],
      ['Starters', 'المقبلات', 'Margarita Pizza', 'بيتزا مارغريتا', 'Classic tomato and mozzarella pizza', 'بيتزا الطماطم والموزاريلا الكلاسيكية', '12.00', 'true', 'Dairy', 'new'],
      ['Desserts', 'الحلويات', 'Chocolate Fondant', 'فوندان الشوكولاتة', 'Warm chocolate cake with chocolate lava center', 'كعكة الشوكولاتة الدافئة مع حشوة الشوكولاتة السائلة', '7.50', 'false', 'Dairy', 'chef']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => {
        const clean = field.replace(/"/g, '""');
        return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
      }).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'menu_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const parsedRows = parseCSV(text);
        if (parsedRows.length < 2) {
          throw new Error('CSV file is empty or missing data rows.');
        }

        const headers = parsedRows[0];
        const dataRows = parsedRows.slice(1);

        const cleanHeaderMap = {
          'category': 'category',
          'القسم': 'category',
          'الفئة': 'category',
          'categoryar': 'category_ar',
          'القسمبالعربية': 'category_ar',
          'الفئةبالعربية': 'category_ar',
          'name': 'name',
          'الاسم': 'name',
          'اسمالصنف': 'name',
          'namear': 'name_ar',
          'الاسمبالعربية': 'name_ar',
          'description': 'description',
          'الوصف': 'description',
          'descriptionar': 'description_ar',
          'الوصفبالعربية': 'description_ar',
          'price': 'price',
          'السعر': 'price',
          'available': 'available',
          'متوفر': 'available',
          'allergens': 'allergens',
          'مسبباتالحساسية': 'allergens',
          'badge': 'badge',
          'شارة': 'badge'
        };

        const colIndices = {};
        headers.forEach((h, idx) => {
          const cleanH = h.toLowerCase().trim().replace(/[\s_-]+/g, '');
          const mappedKey = cleanHeaderMap[cleanH];
          if (mappedKey) {
            colIndices[mappedKey] = idx;
          }
        });

        if (colIndices['category'] === undefined) {
          throw new Error('Missing mandatory column: "Category" or "القسم"');
        }
        if (colIndices['name'] === undefined) {
          throw new Error('Missing mandatory column: "Name" or "الاسم"');
        }
        if (colIndices['price'] === undefined) {
          throw new Error('Missing mandatory column: "Price" or "السعر"');
        }

        const importedItems = [];
        const uniqueCategorySet = new Set();
        const categoryArMap = {};

        dataRows.forEach((row, rowIndex) => {
          const getValue = (key) => {
            const idx = colIndices[key];
            return idx !== undefined && row[idx] !== undefined ? row[idx].trim() : '';
          };

          const catName = getValue('category');
          if (!catName) return;

          const name = getValue('name');
          const priceStr = getValue('price').replace(/[^0-9.]/g, '');
          const price = parseFloat(priceStr);

          if (!name || isNaN(price)) {
            return;
          }

          uniqueCategorySet.add(catName);
          const catNameAr = getValue('category_ar');
          if (catNameAr && !categoryArMap[catName]) {
            categoryArMap[catName] = catNameAr;
          }

          let available = true;
          const avStr = getValue('available').toLowerCase();
          if (avStr) {
            const falsyValues = ['false', '0', 'no', 'n', 'لا', 'غير متوفر'];
            if (falsyValues.includes(avStr)) {
              available = false;
            }
          }

          let allergens = [];
          const algStr = getValue('allergens');
          if (algStr) {
            allergens = algStr.split(/[,;]/).map(a => a.trim()).filter(a => a.length > 0);
          }

          let badge = getValue('badge').toLowerCase();
          const validBadges = ['chef', 'bestseller', 'new', 'popular', 'spicy'];
          if (!validBadges.includes(badge)) {
            badge = '';
          }

          importedItems.push({
            categoryName: catName,
            name,
            name_ar: getValue('name_ar') || null,
            description: getValue('description') || null,
            description_ar: getValue('description_ar') || null,
            price,
            available,
            allergens,
            badge: badge || null,
            csvRowIndex: rowIndex
          });
        });

        if (importedItems.length === 0) {
          throw new Error('No valid items could be parsed from the CSV file.');
        }

        const updatedCategories = [...categories];
        const categoryNameToIdMap = {};

        updatedCategories.forEach(cat => {
          categoryNameToIdMap[cat.name.toLowerCase()] = cat.id;
        });

        const missingCategoriesToInsert = [];
        Array.from(uniqueCategorySet).forEach((catName) => {
          if (!categoryNameToIdMap[catName.toLowerCase()]) {
            missingCategoriesToInsert.push({
              restaurant_id: profile.id,
              name: catName,
              name_ar: categoryArMap[catName] || null,
              order_index: updatedCategories.length + missingCategoriesToInsert.length
            });
          }
        });

        if (missingCategoriesToInsert.length > 0) {
          const { data: insertedCats, error: catInsertError } = await browserSupabase
            .from('categories')
            .insert(missingCategoriesToInsert)
            .select();

          if (catInsertError) throw catInsertError;
          if (insertedCats) {
            insertedCats.forEach(newCat => {
              updatedCategories.push(newCat);
              categoryNameToIdMap[newCat.name.toLowerCase()] = newCat.id;
            });
            setCategories(updatedCategories);
          }
        }

        const maxOrderIndexByCat = {};
        menuItems.forEach(item => {
          const catId = item.category_id;
          maxOrderIndexByCat[catId] = Math.max(maxOrderIndexByCat[catId] || -1, item.order_index);
        });

        const newItemsToInsert = importedItems.map(item => {
          const catId = categoryNameToIdMap[item.categoryName.toLowerCase()];
          if (maxOrderIndexByCat[catId] === undefined) {
            maxOrderIndexByCat[catId] = -1;
          }
          const nextIndex = ++maxOrderIndexByCat[catId];
          return {
            restaurant_id: profile.id,
            category_id: catId,
            name: item.name,
            name_ar: item.name_ar,
            description: item.description,
            description_ar: item.description_ar,
            price: item.price,
            available: item.available,
            allergens: item.allergens,
            badge: item.badge,
            order_index: nextIndex
          };
        });

        const { data: insertedItems, error: itemsInsertError } = await browserSupabase
          .from('menu_items')
          .insert(newItemsToInsert)
          .select();

        if (itemsInsertError) throw itemsInsertError;

        if (insertedItems) {
          const newItemsList = [...menuItems, ...insertedItems];
          setMenuItems(newItemsList);

          if (!selectedCategoryId && updatedCategories.length > 0) {
            setSelectedCategoryId(updatedCategories[0].id);
          }
        }

        showNotification('success', `Imported successfully! Created ${missingCategoriesToInsert.length} new categories and ${newItemsToInsert.length} menu items.`);
      } catch (err) {
        showNotification('error', `Failed to import CSV: ${err.message}`);
      } finally {
        setImportingCsv(false);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      showNotification('error', 'Error reading CSV file.');
      setImportingCsv(false);
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const activeItems = menuItems
    .filter(item => item.category_id === selectedCategoryId)
    .sort((a, b) => a.order_index - b.order_index);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        type="file"
        id="csv-import-input"
        accept=".csv"
        onChange={handleCSVImport}
        className="hidden"
      />

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-black text-white">Menu Builder</h1>
          <p className="text-slate-400 text-sm">Drag and drop categories or items to reorder them in real time.</p>
        </div>
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <button
            onClick={downloadCSVTemplate}
            className="inline-flex items-center space-x-1.5 border border-slate-800 hover:border-amber-550 hover:text-amber-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4 text-amber-500" />
            <span>Download Template</span>
          </button>
          <button
            onClick={() => document.getElementById('csv-import-input').click()}
            disabled={importingCsv}
            className="inline-flex items-center space-x-1.5 border border-slate-800 hover:border-emerald-550 hover:text-emerald-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {importingCsv ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            ) : (
              <Upload className="h-4 w-4 text-emerald-500" />
            )}
            <span>{importingCsv ? 'Importing...' : 'Import CSV'}</span>
          </button>
          <button
            onClick={handleAutoFetchImages}
            disabled={fetchingImages}
            className="inline-flex items-center space-x-1.5 border border-slate-800 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {fetchingImages ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-orange-500" />
            )}
            <span>{fetchingImages ? 'Fetching...' : 'Fetch automatic pictures'}</span>
          </button>
          <button
            onClick={openAddCategory}
            className="inline-flex items-center space-x-1.5 border border-slate-800 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-orange-500" />
            <span>Add Category</span>
          </button>
          <button
            onClick={openAddItem}
            disabled={categories.length === 0}
            className="inline-flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Floating Stackable Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-[#111A2E] shadow-2xl transition-all duration-300 animate-slide-up text-slate-200"
            style={{ borderLeftWidth: '5px', borderLeftColor: toast.type === 'error' ? '#f97316' : '#10b981' }}
          >
            <div className="flex items-start space-x-3 gap-3">
              {toast.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              ) : (
                <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs text-white">
                  {toast.type === 'error' ? 'Error' : 'Success'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {toast.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors ml-4 shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      {categories.length === 0 ? (
        <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center backdrop-blur-md shadow-xl">
          <div className="h-14 w-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 text-orange-500 shadow-inner animate-pulse">
            <Utensils className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No Menu Categories Yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-6">Create your first category or import your menu from a CSV spreadsheet to get started.</p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={openAddCategory}
              className="bg-orange-500 hover:bg-orange-600 text-slate-955 font-bold py-2.5 px-5 rounded-xl text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Create Category
            </button>
            <button
              onClick={() => document.getElementById('csv-import-input').click()}
              disabled={importingCsv}
              className="bg-[#0B0F19]/40 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all active:scale-[0.98] inline-flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {importingCsv ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              ) : (
                <Upload className="h-4 w-4 text-emerald-500" />
              )}
              <span>Import CSV Menu</span>
            </button>
          </div>
          <button 
            type="button"
            onClick={downloadCSVTemplate}
            className="mt-4 text-xs font-semibold text-slate-500 hover:text-orange-400 underline transition-all cursor-pointer"
          >
            Download CSV Import Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center justify-between">
              <span>Categories</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold font-sans">
                {categories.length}
              </span>
            </h2>
            <div className="space-y-1">
              {categories.map((cat, idx) => {
                const isActive = selectedCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={() => handleCategoryDragStart(idx)}
                    onDragOver={handleCategoryDragOver}
                    onDrop={() => handleCategoryDrop(idx)}
                    className={`flex items-center justify-between group rounded-xl p-2 transition-all cursor-grab active:cursor-grabbing border ${
                      isActive 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                        : 'border-transparent text-slate-400 hover:bg-[#0B0F19]/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                      <Move className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                      <button
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="flex-1 text-left text-sm font-semibold py-1 px-1 focus:outline-none truncate cursor-pointer"
                      >
                        {cat.name} {cat.name_ar && <span className="text-slate-500 text-xs font-normal">({cat.name_ar})</span>}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Edit Category Name"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded hover:bg-rose-950/40 text-rose-455 hover:text-rose-300 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 px-2 text-[10px] text-slate-500 leading-normal flex items-start space-x-1">
              <Info className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
              <span>Drag categories to reorder them in the customer-facing menu.</span>
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800/80 px-2">
              <button
                type="button"
                onClick={downloadCSVTemplate}
                className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 border border-dashed border-slate-800 hover:border-orange-500 hover:text-orange-400 text-slate-400 rounded-xl text-xs font-semibold transition-all bg-[#0B0F19]/40 hover:bg-[#0B0F19]/80 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-orange-500" />
                <span>CSV Import Template</span>
              </button>
            </div>
          </div>

          {/* Items Display Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
              <div>
                <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Active Category</span>
                <h2 className="text-lg font-bold text-white">{activeCategory?.name || 'Loading...'}</h2>
              </div>
              <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl">
                {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {activeItems.length === 0 ? (
              <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center backdrop-blur-md shadow-xl">
                <ImageIcon className="h-10 w-10 text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No items in this category</h3>
                <p className="text-slate-400 text-xs max-w-xs mb-4">Start showcasing your dishes by adding a menu item under &quot;{activeCategory?.name}&quot;.</p>
                <button
                  onClick={openAddItem}
                  className="inline-flex items-center space-x-1 text-orange-400 hover:text-orange-355 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Item</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={() => handleItemDragStart(idx)}
                    onDragOver={handleItemDragOver}
                    onDrop={() => handleItemDrop(idx)}
                    className={`bg-[#111A2E]/60 border rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all cursor-grab active:cursor-grabbing hover:border-orange-500/40 backdrop-blur-md ${
                      item.available ? 'border-slate-800/80' : 'border-slate-800/40 opacity-50 bg-[#0B0F19]/20'
                    }`}
                  >
                    {/* Item Image */}
                    {item.image_url ? (
                      <div className="relative h-40 w-full bg-[#0B0F19] shrink-0 select-none pointer-events-none">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="h-full w-full object-cover"
                        />
                        {!item.available && (
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                            <span className="bg-slate-900/90 border border-slate-800 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-full">
                              Sold Out
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 h-8 w-8 bg-slate-900/80 backdrop-blur rounded-lg flex items-center justify-center text-white border border-slate-800/60">
                          <Move className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-[#0B0F19] border-b border-slate-800/80 flex items-center justify-center text-slate-700 shrink-0 select-none relative">
                        <Utensils className="h-8 w-8" />
                        <div className="absolute top-3 right-3 h-8 w-8 bg-slate-900/80 backdrop-blur rounded-lg flex items-center justify-center text-slate-400 border border-slate-800/60">
                          <Move className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <h4 className="font-bold text-white text-sm leading-snug flex items-center flex-wrap gap-1">
                            <span>{item.name}</span>
                            {item.name_ar && <span className="text-slate-500 text-xs font-normal">({item.name_ar})</span>}
                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.badge === 'chef' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                                item.badge === 'bestseller' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' :
                                item.badge === 'new' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                                item.badge === 'popular' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' :
                                item.badge === 'spicy' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : ''
                              }`}>
                                {item.badge === 'chef' ? '⭐ Chef' :
                                 item.badge === 'bestseller' ? '🔥 Seller' :
                                 item.badge === 'new' ? '✨ New' :
                                 item.badge === 'popular' ? '📈 Popular' :
                                 item.badge === 'spicy' ? '🌶️ Spicy' : ''}
                              </span>
                            )}
                          </h4>
                          <span className="font-bold text-orange-400 text-sm shrink-0">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile?.currency || 'USD' }).format(item.price)}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}

                        {/* Allergen Badges */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {item.allergens.map((alg) => (
                              <span 
                                key={alg} 
                                className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-auto">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={() => handleToggleAvailability(item)}
                            className="h-3.5 w-3.5 rounded text-orange-500 focus:ring-orange-500 border-slate-700 bg-[#0B0F19]"
                          />
                          <span className="text-xs text-slate-400 font-semibold">Available</span>
                        </label>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDuplicateItem(item)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:bg-[#0B0F19] hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Duplicate Item"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:bg-rose-950/40 hover:border-rose-900/60 text-rose-450 hover:text-rose-350 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111A2E] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {categoryModalMode === 'add' ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Pasta, Burgers, Soft Drinks"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Category Name (Arabic)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: المعكرونة، البرغر، المشروبات"
                    value={categoryNameAr}
                    onChange={(e) => setCategoryNameAr(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-right"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="px-5 py-4 bg-[#0B0F19]/40 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCategory && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{categoryModalMode === 'add' ? 'Create' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MENU ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111A2E] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white text-base">
                {itemModalMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Truffle Fries"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Price ({profile?.currency || 'USD'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="9.99"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Item Name (Arabic)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: بطاطس بالتروفل"
                    value={itemNameAr}
                    onChange={(e) => setItemNameAr(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-right"
                    dir="rtl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={itemCategoryId}
                      onChange={(e) => setItemCategoryId(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#111A2E]">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Availability
                    </label>
                    <select
                      value={itemIsAvailable ? 'true' : 'false'}
                      onChange={(e) => setItemIsAvailable(e.target.value === 'true')}
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                    >
                      <option value="true" className="bg-[#111A2E]">In Stock / Available</option>
                      <option value="false" className="bg-[#111A2E]">Sold Out / Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Promo Badge
                    </label>
                    <select
                      value={itemBadge}
                      onChange={(e) => setItemBadge(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                    >
                      <option value="" className="bg-[#111A2E]">None</option>
                      <option value="chef" className="bg-[#111A2E]">⭐ Chef's Special</option>
                      <option value="bestseller" className="bg-[#111A2E]">🔥 Best Seller</option>
                      <option value="new" className="bg-[#111A2E]">✨ New</option>
                      <option value="popular" className="bg-[#111A2E]">📈 Popular</option>
                      <option value="spicy" className="bg-[#111A2E]">🌶️ Spicy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of ingredients, flavor profile..."
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description (Arabic)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف قصير للمكونات، النكهة، إلخ..."
                    value={itemDescriptionAr}
                    onChange={(e) => setItemDescriptionAr(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-right"
                    dir="rtl"
                  />
                </div>

                {/* Allergen Checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Dietary / Allergen Info
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allergenOptions.map((alg) => {
                      const isSelected = itemAllergens.includes(alg);
                      return (
                        <button
                          key={alg}
                          type="button"
                          onClick={() => handleAllergenToggle(alg)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-orange-500 border-orange-600 text-slate-950 shadow-sm'
                              : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:bg-[#0B0F19]/80'
                          }`}
                        >
                          {alg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Compressed Item Image Uploader */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Item Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 bg-[#0B0F19] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center shrink-0">
                      {itemImageUrl ? (
                        <img src={itemImageUrl} alt="Upload Preview" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-700" />
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 border border-slate-800 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-sm">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Choose Image</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload} 
                              disabled={uploadingImage} 
                              className="hidden" 
                            />
                          </>
                        )}
                      </label>
                      <p className="text-[10px] text-slate-500 mt-1.5">Max 300KB, max 800px width/height. Web-optimized.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-[#0B0F19]/40 border-t border-slate-800/80 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItem || uploadingImage}
                  className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                >
                  {submittingItem && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{itemModalMode === 'add' ? 'Create' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Edit2, Trash2, Loader2, Image as ImageIcon, 
  AlertCircle, FolderPlus, Utensils, Tag, Info, Check, Sparkles, Move, X, Copy
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function MenuPage() {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        setProfile(profileData);

        if (profileData) {
          // Fetch categories ordered by order_index
          const { data: categoryData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', profileData.id)
            .order('order_index', { ascending: true });

          if (catError) throw catError;
          setCategories(categoryData || []);

          if (categoryData && categoryData.length > 0) {
            setSelectedCategoryId(categoryData[0].id);
          }

          // Fetch menu items ordered by order_index
          const { data: itemData, error: itemError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', profileData.id)
            .order('order_index', { ascending: true });

          if (itemError) throw itemError;
          setMenuItems(itemData || []);
        }
      } catch (error) {
        showNotification('error', `Error loading menu: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [showNotification]);


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

    // Update state optimistically
    setCategories(newCategories);

    try {
      const updates = newCategories.map((c, idx) => ({
        id: c.id,
        restaurant_id: profile.id,
        name: c.name,
        name_ar: c.name_ar,
        order_index: idx,
      }));

      const { error } = await supabase.from('categories').upsert(updates);
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

    // Rebuild menuItems state with updated order_index
    const otherItems = menuItems.filter(item => item.category_id !== selectedCategoryId);
    const updatedItemsList = [
      ...currentCatItems.map((item, idx) => ({ ...item, order_index: idx })),
      ...otherItems
    ];

    // Update state optimistically
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

      const { error } = await supabase.from('menu_items').upsert(updates);
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
        const { data, error } = await supabase
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
        const { error } = await supabase
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
      const { error } = await supabase.from('categories').delete().eq('id', catId);
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
      // Compress image to standard optimized size (max 300KB, max resolution 800px width/height)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `items/${fileName}`;

      // Upload to Supabase Storage in "menu-images" bucket
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
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
        const { data, error } = await supabase
          .from('menu_items')
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        setMenuItems([...menuItems, data]);
        showNotification('success', 'Menu item added successfully!');
      } else {
        const { error } = await supabase
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
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
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
      // Optimistic update
      setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, available: newStatus } : i));

      const { error } = await supabase
        .from('menu_items')
        .update({ available: newStatus })
        .eq('id', item.id);

      if (error) throw error;
    } catch (error) {
      showNotification('error', `Could not update status: ${error.message}`);
      // Revert state
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
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Menu Builder</h1>
          <p className="text-slate-500 text-sm">Drag and drop categories or items to reorder them in real time.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={openAddCategory}
            className="inline-flex items-center space-x-1.5 border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={openAddItem}
            disabled={categories.length === 0}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-50"
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
            className="pointer-events-auto flex items-start justify-between p-4 rounded-xl border bg-white shadow-2xl transition-all duration-300 animate-slide-up text-slate-800"
            style={{ borderLeftWidth: '5px', borderLeftColor: toast.type === 'error' ? '#ef4444' : '#10b981' }}
          >
            <div className="flex items-start space-x-3 gap-3">
              {toast.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {toast.type === 'error' ? 'Error' : 'Success'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {toast.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-4 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      {categories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center mb-4 text-orange-500">
            <Utensils className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1.5">No Menu Categories Yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-6">Create your first category to start building your restaurant menu.</p>
          <button
            onClick={openAddCategory}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-md transition-all active:scale-[0.98]"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center justify-between">
              <span>Categories</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold font-sans">
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
                        ? 'bg-orange-50 border-orange-100 text-orange-600' 
                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                      <Move className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 shrink-0" />
                      <button
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="flex-1 text-left text-sm font-semibold py-1 px-1 focus:outline-none truncate"
                      >
                        {cat.name} {cat.name_ar && <span className="text-slate-400 text-xs font-normal">({cat.name_ar})</span>}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1 rounded hover:bg-slate-200/50 text-slate-500 hover:text-slate-700"
                        title="Edit Category Name"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 px-2 text-[10px] text-slate-400 leading-normal flex items-start space-x-1">
              <Info className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
              <span>Drag categories to reorder them in the customer-facing menu.</span>
            </p>
          </div>

          {/* Items Display Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div>
                <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Active Category</span>
                <h2 className="text-lg font-bold text-slate-800">{activeCategory?.name || 'Loading...'}</h2>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
                {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {activeItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
                <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700 mb-1">No items in this category</h3>
                <p className="text-slate-400 text-xs max-w-xs mb-4">Start showcasing your dishes by adding a menu item under &quot;{activeCategory?.name}&quot;.</p>
                <button
                  onClick={openAddItem}
                  className="inline-flex items-center space-x-1 text-orange-500 hover:text-orange-600 text-xs font-bold transition-all"
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
                    className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all cursor-grab active:cursor-grabbing hover:border-orange-200/60 ${
                      item.available ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Item Image */}
                    {item.image_url ? (
                      <div className="relative h-40 w-full bg-slate-100 shrink-0 select-none pointer-events-none">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="h-full w-full object-cover"
                        />
                        {!item.available && (
                          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                            <span className="bg-slate-900/90 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                              Sold Out
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 h-8 w-8 bg-slate-900/80 backdrop-blur rounded-lg flex items-center justify-center text-white">
                          <Move className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-300 shrink-0 select-none relative">
                        <Utensils className="h-8 w-8" />
                        <div className="absolute top-3 right-3 h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                          <Move className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="font-bold text-slate-800 text-sm leading-snug flex items-center flex-wrap gap-1">
                            <span>{item.name}</span>
                            {item.name_ar && <span className="text-slate-450 text-xs font-normal">({item.name_ar})</span>}
                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.badge === 'chef' ? 'bg-amber-100 text-amber-700' :
                                item.badge === 'bestseller' ? 'bg-orange-100 text-orange-700' :
                                item.badge === 'new' ? 'bg-blue-100 text-blue-700' :
                                item.badge === 'popular' ? 'bg-purple-100 text-purple-700' :
                                item.badge === 'spicy' ? 'bg-red-100 text-red-700' : ''
                              }`}>
                                {item.badge === 'chef' ? '⭐ Chef' :
                                 item.badge === 'bestseller' ? '🔥 Seller' :
                                 item.badge === 'new' ? '✨ New' :
                                 item.badge === 'popular' ? '📈 Popular' :
                                 item.badge === 'spicy' ? '🌶️ Spicy' : ''}
                              </span>
                            )}
                          </h4>
                          <span className="font-bold text-orange-500 text-sm shrink-0">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile?.currency || 'USD' }).format(item.price)}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}

                        {/* Allergen Badges */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {item.allergens.map((alg) => (
                              <span 
                                key={alg} 
                                className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/50"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={() => handleToggleAvailability(item)}
                            className="h-3.5 w-3.5 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                          />
                          <span className="text-xs text-slate-500 font-semibold">Available</span>
                        </label>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDuplicateItem(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-700 transition-all"
                            title="Duplicate Item"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 transition-all"
                            title="Edit Item"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-rose-500 hover:text-rose-700 transition-all"
                            title="Delete Item"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {categoryModalMode === 'add' ? 'Add New Category' : 'Edit Category'}
              </h3>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Pasta, Burgers, Soft Drinks"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Category Name (Arabic)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: المعكرونة، البرغر، المشروبات"
                    value={categoryNameAr}
                    onChange={(e) => setCategoryNameAr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-right"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center space-x-1 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-base">
                {itemModalMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
              </h3>
            </div>

            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Truffle Fries"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Price ({profile?.currency || 'USD'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="9.99"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Item Name (Arabic)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: بطاطس بالتروفل"
                    value={itemNameAr}
                    onChange={(e) => setItemNameAr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-right"
                    dir="rtl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={itemCategoryId}
                      onChange={(e) => setItemCategoryId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Availability
                    </label>
                    <select
                      value={itemIsAvailable ? 'true' : 'false'}
                      onChange={(e) => setItemIsAvailable(e.target.value === 'true')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                    >
                      <option value="true">In Stock / Available</option>
                      <option value="false">Sold Out / Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Promo Badge
                    </label>
                    <select
                      value={itemBadge}
                      onChange={(e) => setItemBadge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                    >
                      <option value="">None</option>
                      <option value="chef">⭐ Chef's Special</option>
                      <option value="bestseller">🔥 Best Seller</option>
                      <option value="new">✨ New</option>
                      <option value="popular">📈 Popular</option>
                      <option value="spicy">🌶️ Spicy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of ingredients, flavor profile..."
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Description (Arabic)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف قصير للمكونات، النكهة، إلخ..."
                    value={itemDescriptionAr}
                    onChange={(e) => setItemDescriptionAr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-right"
                    dir="rtl"
                  />
                </div>

                {/* Allergen Checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Item Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {itemImageUrl ? (
                        <img src={itemImageUrl} alt="Upload Preview" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-sm">
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
                      <p className="text-[10px] text-slate-400 mt-1.5">Max 300KB, max 800px width/height. Web-optimized.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItem || uploadingImage}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center space-x-1 disabled:opacity-50"
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

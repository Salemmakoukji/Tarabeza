import { createClient } from '../lib/supabase/server';

export async function action({ request }) {
  const supabase = await createClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === 'auto-fetch-images') {
    const { data: profile } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!profile) {
      return Response.json({ success: false, error: "Restaurant profile not found" }, { status: 404 });
    }

    const { data: items, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name, name_ar, image_url')
      .eq('restaurant_id', profile.id);

    if (fetchError) {
      return Response.json({ success: false, error: `Database error: ${fetchError.message}` }, { status: 500 });
    }

    const itemsWithoutImages = items.filter(item => !item.image_url || item.image_url.trim() === '');
    if (itemsWithoutImages.length === 0) {
      return Response.json({ success: true, count: 0, updatedItems: [] });
    }

    let apiKey = 'AIzaSyD69KrexQBFHqioknRM6b6c3W0FzCvPnBc';
    let cx = 'f115c11eac5834f0f';

    try {
      const fs = await import('fs');
      const path = await import('path');
      const searchConfigPath = path.resolve(process.cwd(), '.googlesearch');
      if (fs.existsSync(searchConfigPath)) {
        const fileContent = fs.readFileSync(searchConfigPath, 'utf8').trim();
        if (fileContent) {
          try {
            const json = JSON.parse(fileContent);
            apiKey = json.apiKey || json.GOOGLE_API_KEY || json.api_key || '';
            cx = json.cx || json.GOOGLE_CX || json.cx_id || '';
          } catch (e) {
            const lines = fileContent.split('\n');
            lines.forEach(line => {
              const parts = line.split('=');
              if (parts.length >= 2) {
                const k = parts[0].trim().toUpperCase();
                const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                if (k === 'GOOGLE_API_KEY' || k === 'API_KEY') apiKey = v;
                if (k === 'GOOGLE_CX' || k === 'CX') cx = v;
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Error reading .googlesearch config on server:", err);
    }

    if (!apiKey || !cx) {
      return Response.json({
        success: false,
        error: "Google Search API Key or Search Engine ID (CX) not found in your .googlesearch file. Please save it in your editor."
      }, { status: 400 });
    }

    const updatedItems = [];
    let count = 0;

    for (const item of itemsWithoutImages) {
      if (count >= 10) break;

      const query = item.name;
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
          return Response.json({
            success: false,
            error: `Google Search API Error: ${data.error.message} (Code: ${data.error.code})`
          }, { status: 400 });
        }

        if (data.items && data.items.length > 0 && data.items[0].link) {
          const imgUrl = data.items[0].link;

          const { error: updateError } = await supabase
            .from('menu_items')
            .update({ image_url: imgUrl })
            .eq('id', item.id);

          if (!updateError) {
            updatedItems.push({ id: item.id, image_url: imgUrl });
            count++;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch image for ${item.name}:`, err);
      }
    }

    return Response.json({ success: true, count, updatedItems });
  }

  return Response.json({ success: false, error: "Action not recognized" }, { status: 400 });
}

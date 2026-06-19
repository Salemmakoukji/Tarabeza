'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, QrCode, Download, Copy, Check, Palette, Sparkles, Printer, FileText } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// Curated list of high-quality fonts for printing and preview
const AVAILABLE_FONTS = [
  { id: 'helvetica', name: 'Modern Sans (Helvetica)', type: 'core', fontName: 'helvetica' },
  { id: 'times', name: 'Classic Serif (Times)', type: 'core', fontName: 'times' },
  { id: 'courier', name: 'Standard Monospace', type: 'core', fontName: 'courier' },
  { 
    id: 'poppins', 
    name: 'Poppins (Modern Clean)', 
    type: 'google', 
    fontName: 'Poppins', 
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf'
  },
  { 
    id: 'playfair', 
    name: 'Playfair Display (Elegant Serif)', 
    type: 'google', 
    fontName: 'Playfair', 
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-Regular.ttf'
  },
  { 
    id: 'cinzel', 
    name: 'Cinzel (Luxury Classical)', 
    type: 'google', 
    fontName: 'Cinzel', 
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel-Regular.ttf'
  },
  { 
    id: 'lobster', 
    name: 'Lobster (Bold Script)', 
    type: 'google', 
    fontName: 'Lobster', 
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/lobster/Lobster-Regular.ttf'
  },
  { 
    id: 'caveat', 
    name: 'Caveat (Chic Handwritten)', 
    type: 'google', 
    fontName: 'Caveat', 
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat-Regular.ttf'
  },
  { 
    id: 'spacemono', 
    name: 'Space Mono (Retro Code)', 
    type: 'google', 
    fontName: 'SpaceMono', 
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacemono/SpaceMono-Regular.ttf'
  }
];

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 249, g: 115, b: 22 };
}

function rotateImage180(imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = imgUrl;
  });
}

async function loadCustomFont(doc, fontName, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Font download failed');
    const arrayBuffer = await response.arrayBuffer();
    
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    
    const filename = `${fontName}.ttf`;
    doc.addFileToVFS(filename, base64);
    doc.addFont(filename, fontName, 'normal');
    doc.addFont(filename, fontName, 'bold');
    return true;
  } catch (err) {
    console.error(`Failed to register custom font ${fontName}:`, err);
    return false;
  }
}

async function drawCustomQR(text, options) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const size = qr.modules.size;
  
  const canvas = document.createElement('canvas');
  const canvasSize = 600;
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = options.bgColor || '#ffffff';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  const margin = 28;
  const drawSize = canvasSize - (margin * 2);
  const cellSize = drawSize / size;
  
  const isEyeModule = (r, c) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    return false;
  };
  
  let patternStyle;
  if (options.qrStyleType === 'gradient') {
    if (options.gradientDirection === 'horizontal') {
      patternStyle = ctx.createLinearGradient(margin, 0, margin + drawSize, 0);
    } else if (options.gradientDirection === 'vertical') {
      patternStyle = ctx.createLinearGradient(0, margin, 0, margin + drawSize);
    } else if (options.gradientDirection === 'radial') {
      patternStyle = ctx.createRadialGradient(
        canvasSize / 2, canvasSize / 2, 10,
        canvasSize / 2, canvasSize / 2, canvasSize / 2
      );
    } else {
      patternStyle = ctx.createLinearGradient(margin, margin, margin + drawSize, margin + drawSize);
    }
    patternStyle.addColorStop(0, options.fgColor);
    patternStyle.addColorStop(1, options.fgColor2 || options.fgColor);
  } else {
    patternStyle = options.fgColor;
  }
  
  ctx.fillStyle = patternStyle;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.data[r * size + c]) {
        if (isEyeModule(r, c)) continue;
        
        if (options.showLogo) {
          const logoCellSpan = Math.ceil(size * 0.22);
          const centerCell = Math.floor(size / 2);
          const minCell = centerCell - Math.floor(logoCellSpan / 2);
          const maxCell = centerCell + Math.floor(logoCellSpan / 2);
          if (r >= minCell && r <= maxCell && c >= minCell && c <= maxCell) {
            continue;
          }
        }
        
        const x = margin + (c * cellSize);
        const y = margin + (r * cellSize);
        
        ctx.beginPath();
        if (options.dotStyle === 'circle') {
          const radius = (cellSize / 2) * 0.85;
          ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.rect(x + 0.1, y + 0.1, cellSize - 0.2, cellSize - 0.2);
          ctx.fill();
        }
      }
    }
  }
  
  const drawEye = (x, y) => {
    const eyeSize = cellSize * 7;
    const eyeColor = options.eyeColor || options.fgColor;
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = cellSize;
    ctx.fillStyle = eyeColor;
    
    const offset = cellSize / 2;
    const strokeX = x + offset;
    const strokeY = y + offset;
    const strokeW = eyeSize - cellSize;
    
    ctx.beginPath();
    if (options.eyeStyle === 'circle') {
      ctx.arc(x + eyeSize / 2, y + eyeSize / 2, (eyeSize - cellSize) / 2, 0, Math.PI * 2);
    } else if (options.eyeStyle === 'rounded') {
      const radiusOuter = cellSize * 1.6;
      ctx.roundRect ? ctx.roundRect(strokeX, strokeY, strokeW, strokeW, radiusOuter) : ctx.rect(strokeX, strokeY, strokeW, strokeW);
    } else {
      ctx.rect(strokeX, strokeY, strokeW, strokeW);
    }
    ctx.stroke();
    
    ctx.beginPath();
    const dotX = x + (cellSize * 2);
    const dotY = y + (cellSize * 2);
    const dotW = cellSize * 3;
    
    if (options.eyeStyle === 'circle') {
      ctx.arc(x + eyeSize / 2, y + eyeSize / 2, dotW / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (options.eyeStyle === 'rounded') {
      const radiusInner = cellSize * 0.7;
      ctx.roundRect ? ctx.roundRect(dotX, dotY, dotW, dotW, radiusInner) : ctx.rect(dotX, dotY, dotW, dotW);
      ctx.fill();
    } else {
      ctx.rect(dotX, dotY, dotW, dotW);
      ctx.fill();
    }
  };
  
  drawEye(margin, margin);
  drawEye(margin + (size - 7) * cellSize, margin);
  drawEye(margin, margin + (size - 7) * cellSize);
  
  if (options.showLogo) {
    const logoSize = Math.floor(canvasSize * 0.20);
    const logoPos = (canvasSize - logoSize) / 2;
    const r = options.logoStyle === 'circle' ? logoSize / 2 : 12;
    
    ctx.fillStyle = options.bgColor || '#ffffff';
    ctx.beginPath();
    if (options.logoStyle === 'circle') {
      ctx.arc(canvasSize / 2, canvasSize / 2, logoSize / 2 + 5, 0, Math.PI * 2);
    } else {
      ctx.roundRect ? ctx.roundRect(logoPos - 4, logoPos - 4, logoSize + 8, logoSize + 8, r + 2) : ctx.rect(logoPos - 4, logoPos - 4, logoSize + 8, logoSize + 8);
    }
    ctx.fill();
    
    if (options.logoUrl) {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = options.logoUrl;
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        if (options.logoStyle === 'circle') {
          ctx.arc(canvasSize / 2, canvasSize / 2, logoSize / 2, 0, Math.PI * 2);
        } else {
          ctx.roundRect ? ctx.roundRect(logoPos, logoPos, logoSize, logoSize, r) : ctx.rect(logoPos, logoPos, logoSize, logoSize);
        }
        ctx.clip();
        ctx.drawImage(logoImg, logoPos, logoPos, logoSize, logoSize);
        ctx.restore();
      } else {
        ctx.fillStyle = options.fgColor;
        ctx.font = `bold ${Math.floor(logoSize * 0.65)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.brandLetter || 'M', canvasSize / 2, canvasSize / 2);
      }
    } else {
      ctx.fillStyle = options.fgColor;
      ctx.font = `bold ${Math.floor(logoSize * 0.65)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(options.brandLetter || 'M', canvasSize / 2, canvasSize / 2);
    }
  }
  
  return canvas.toDataURL('image/png');
}

export default function QRClient({ profile }) {
  const [fgColor, setFgColor] = useState(profile?.qr_fg_color || '#000000');
  const [fgColor2, setFgColor2] = useState(profile?.qr_fg_color2 || '#f97316');
  const [bgColor, setBgColor] = useState(profile?.qr_bg_color || '#ffffff');
  const [qrStyleType, setQrStyleType] = useState(profile?.qr_style_type || 'solid');
  const [gradientDirection, setGradientDirection] = useState(profile?.qr_gradient_direction || 'diagonal');
  const [dotStyle, setDotStyle] = useState(profile?.qr_dot_style || 'square');
  const [eyeStyle, setEyeStyle] = useState(profile?.qr_eye_style || 'square');
  const [eyeColor, setEyeColor] = useState(profile?.qr_eye_color || '#000000');
  const [showLogo, setShowLogo] = useState(profile?.qr_show_logo !== undefined ? profile?.qr_show_logo : true);
  const [logoStyle, setLogoStyle] = useState(profile?.qr_logo_style || 'square');
  const [qrFontFamily, setQrFontFamily] = useState(profile?.qr_font_family || 'helvetica');
  
  const [qrUrl, setQrUrl] = useState('');
  const [wifiQrUrl, setWifiQrUrl] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && profile) {
      setMenuUrl(`${window.location.origin}/menu/${profile.slug}`);
    }
  }, [profile]);

  useEffect(() => {
    const selected = AVAILABLE_FONTS.find(f => f.id === qrFontFamily);
    if (selected && selected.type === 'google') {
      const fontId = `gfont-${selected.id}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        const gName = selected.name.split(' (')[0].replace(' ', '+');
        link.href = `https://fonts.googleapis.com/css2?family=${gName}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [qrFontFamily]);

  const getSelectedFontFamily = () => {
    const selected = AVAILABLE_FONTS.find(f => f.id === qrFontFamily);
    if (selected) {
      if (selected.type === 'google') {
        return selected.fontName === 'SpaceMono' ? '"Space Mono", monospace' : `"${selected.fontName}", sans-serif`;
      }
      if (selected.id === 'times') return 'Times, "Times New Roman", serif';
      if (selected.id === 'courier') return 'Courier, monospace';
      return 'Helvetica, Arial, sans-serif';
    }
    return 'inherit';
  };

  useEffect(() => {
    if (!menuUrl) return;

    const generateQR = async () => {
      try {
        const url = await drawCustomQR(menuUrl, {
          fgColor,
          fgColor2,
          bgColor,
          qrStyleType,
          gradientDirection,
          dotStyle,
          eyeStyle,
          eyeColor,
          showLogo,
          logoUrl: profile?.logo_url,
          logoStyle,
          brandLetter: profile?.name ? profile.name[0] : 'M'
        });
        setQrUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [menuUrl, fgColor, fgColor2, bgColor, qrStyleType, gradientDirection, dotStyle, eyeStyle, eyeColor, showLogo, logoStyle, profile?.logo_url, profile?.name]);

  useEffect(() => {
    if (!profile?.wifi_ssid) {
      setWifiQrUrl('');
      return;
    }

    const generateWifiQR = async () => {
      try {
        const ssid = profile.wifi_ssid;
        const encryption = profile.wifi_encryption || 'WPA';
        const password = profile.wifi_password || '';
        const wifiString = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
        
        const url = await drawCustomQR(wifiString, {
          fgColor,
          fgColor2,
          bgColor,
          qrStyleType,
          gradientDirection,
          dotStyle,
          eyeStyle,
          eyeColor,
          showLogo: false,
          logoUrl: null,
          logoStyle
        });
        setWifiQrUrl(url);
      } catch (err) {
        console.error('Error generating Wi-Fi QR code:', err);
      }
    };

    generateWifiQR();
  }, [profile?.wifi_ssid, profile?.wifi_password, profile?.wifi_encryption, fgColor, fgColor2, bgColor, qrStyleType, gradientDirection, dotStyle, eyeStyle, eyeColor, logoStyle]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.download = `${profile?.slug || 'menu'}-qrcode.png`;
    link.href = qrUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadWifi = () => {
    if (!wifiQrUrl) return;
    const link = document.createElement('a');
    link.download = `${profile?.slug || 'wifi'}-wifi-qrcode.png`;
    link.href = wifiQrUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveQRSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          qr_fg_color: fgColor,
          qr_fg_color2: fgColor2,
          qr_bg_color: bgColor,
          qr_style_type: qrStyleType,
          qr_gradient_direction: gradientDirection,
          qr_dot_style: dotStyle,
          qr_eye_style: eyeStyle,
          qr_eye_color: eyeColor,
          qr_show_logo: showLogo,
          qr_logo_style: logoStyle,
          qr_font_family: qrFontFamily
        })
        .eq('owner_id', (await supabase.auth.getUser()).data.user.id);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving QR settings:', err);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!qrUrl) return;
    setDownloadingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const midY = pageHeight / 2;

      const brandColorHex = profile?.theme_color || '#f97316';
      const brandRgb = hexToRgb(brandColorHex);

      const selected = AVAILABLE_FONTS.find(f => f.id === qrFontFamily);
      const pdfFont = selected && selected.type === 'google' ? selected.fontName : qrFontFamily;

      if (selected && selected.type === 'google' && selected.url) {
        await loadCustomFont(doc, selected.fontName, selected.url);
      }

      let rotatedMenuQr = qrUrl;
      try {
        rotatedMenuQr = await rotateImage180(qrUrl);
      } catch (err) {
        console.error('Failed to rotate Menu QR image for PDF:', err);
      }

      doc.setLineWidth(1);
      doc.setDrawColor(brandRgb.r, brandRgb.g, brandRgb.b);
      doc.rect(15, 12, pageWidth - 30, midY - 24);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text('Table / الطاولة # ________', pageWidth / 2, 28, { align: 'center', angle: 180 });

      doc.addImage(rotatedMenuQr, 'PNG', pageWidth / 2 - 27.5, 42, 55, 55);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(profile?.name || 'OUR MENU', pageWidth / 2, 114, { align: 'center', angle: 180 });

      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Scan to View Digital Menu / امسح لمشاهدة المنيو', pageWidth / 2, 121, { align: 'center', angle: 180 });

      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Powered by Tarapeza.com', pageWidth / 2, 131, { align: 'center', angle: 180 });

      doc.setLineWidth(0.4);
      doc.setLineDashPattern([2.5, 2.5], 0);
      doc.setDrawColor(148, 163, 184);
      doc.line(10, midY, pageWidth - 10, midY);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('FOLD LINE / خط الطي', 15, midY - 2);
      doc.text('FOLD LINE / خط الطي', pageWidth - 15, midY - 2, { align: 'right' });

      doc.setLineWidth(1);
      doc.setDrawColor(brandRgb.r, brandRgb.g, brandRgb.b);
      doc.rect(15, midY + 12, pageWidth - 30, midY - 24);

      const hasWifi = !!profile?.wifi_ssid;

      if (hasWifi) {
        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text('FREE WI-FI ACCESS', pageWidth / 2, midY + 28, { align: 'center' });

        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Scan to Connect to network / امسح للاتصال بالشبكة', pageWidth / 2, 35 + midY, { align: 'center' });

        if (wifiQrUrl) {
          doc.addImage(wifiQrUrl, 'PNG', pageWidth / 2 - 27.5, midY + 46, 55, 55);
        }

        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text(`Wi-Fi Network SSID: ${profile.wifi_ssid}`, pageWidth / 2, midY + 112, { align: 'center' });
        if (profile.wifi_password) {
          doc.text(`Password: ${profile.wifi_password}`, pageWidth / 2, midY + 118, { align: 'center' });
        }
      } else {
        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text(profile?.name || 'OUR MENU', pageWidth / 2, midY + 28, { align: 'center' });

        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Scan to View Digital Menu / امسح لمشاهدة المنيو', pageWidth / 2, 35 + midY, { align: 'center' });

        doc.addImage(qrUrl, 'PNG', pageWidth / 2 - 27.5, midY + 46, 55, 55);

        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text('Table / الطاولة # ________', pageWidth / 2, midY + 114, { align: 'center' });
      }

      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Powered by Tarapeza.com', pageWidth / 2, midY + 131, { align: 'center' });

      doc.save(`${profile?.slug || 'menu'}-table-tent-card.pdf`);
    } catch (err) {
      console.error('Error generating PDF flyer:', err);
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 font-sans">QR Code Studio</h1>
        <p className="text-slate-500 text-sm">Design visual QR menus and generate printable table tent cards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Customizer Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-1 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100 font-sans">
              <Palette className="h-5 w-5 text-slate-400" />
              <span>Customize QR Style</span>
            </h2>

            <div className="space-y-5 mt-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar font-sans">
              <div className="space-y-3">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Style & Colors</h3>
                
                <div>
                  <label className="block text-[11px] text-slate-505 mb-1 font-medium">Pattern Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQrStyleType('solid')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        qrStyleType === 'solid'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Solid Color
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrStyleType('gradient')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        qrStyleType === 'gradient'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-505 mb-1 font-medium font-sans">
                      {qrStyleType === 'gradient' ? 'Start Color' : 'QR Color'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-8 w-12 border border-slate-200 rounded cursor-pointer bg-slate-50"
                      />
                      <span className="text-[10px] font-mono text-slate-400">{fgColor.toUpperCase()}</span>
                    </div>
                  </div>

                  {qrStyleType === 'gradient' && (
                    <div>
                      <label className="block text-[11px] text-slate-505 mb-1 font-medium font-sans">End Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={fgColor2}
                          onChange={(e) => setFgColor2(e.target.value)}
                          className="h-8 w-12 border border-slate-200 rounded cursor-pointer bg-slate-50"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{fgColor2.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {qrStyleType === 'gradient' && (
                  <div>
                    <label className="block text-[11px] text-slate-505 mb-1 font-medium">Gradient Flow</label>
                    <select
                      value={gradientDirection}
                      onChange={(e) => setGradientDirection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-605 focus:outline-none"
                    >
                      <option value="diagonal">Diagonal</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                      <option value="radial">Radial</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-505 mb-1 font-medium font-sans">Background Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 w-12 border border-slate-200 rounded cursor-pointer bg-slate-50"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{bgColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pattern Shape</h3>
                
                <div>
                  <label className="block text-[11px] text-slate-505 mb-1.5 font-medium">Dot Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDotStyle('square')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        dotStyle === 'square'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Classic Squares
                    </button>
                    <button
                      type="button"
                      onClick={() => setDotStyle('circle')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        dotStyle === 'circle'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Round Dots
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Finder Eyes</h3>
                
                <div>
                  <label className="block text-[11px] text-slate-505 mb-1.5 font-medium">Eye Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEyeStyle('square')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        eyeStyle === 'square'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Square
                    </button>
                    <button
                      type="button"
                      onClick={() => setEyeStyle('rounded')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        eyeStyle === 'rounded'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Rounded
                    </button>
                    <button
                      type="button"
                      onClick={() => setEyeStyle('circle')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        eyeStyle === 'circle'
                          ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Circle
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-505 mb-1 font-medium font-sans">Eye Frame Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      className="h-8 w-12 border border-slate-200 rounded cursor-pointer bg-slate-50"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{eyeColor.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => setEyeColor(fgColor)}
                      className="text-[10px] font-bold text-slate-400 hover:text-orange-500 underline transition-all"
                    >
                      Match QR
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Logo Overlay</h3>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer h-4 w-4"
                  />
                </div>
                
                {showLogo && (
                  <div>
                    <label className="block text-[11px] text-slate-505 mb-1.5 font-medium">Logo Shield Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoStyle('square')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          logoStyle === 'square'
                            ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Rounded Rect
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoStyle('circle')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          logoStyle === 'circle'
                            ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Circular Badge
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 font-sans">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Typography</h3>
                
                <div>
                  <label className="block text-[11px] text-slate-505 mb-1.5 font-medium">Text Font Style</label>
                  <select
                    value={qrFontFamily}
                    onChange={(e) => setQrFontFamily(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none"
                  >
                    <optgroup label="Standard System Fonts">
                      <option value="helvetica">Modern Sans (Helvetica)</option>
                      <option value="times">Classic Serif (Times)</option>
                      <option value="courier">Retro Mono (Courier)</option>
                    </optgroup>
                    <optgroup label="Google Web Fonts">
                      <option value="poppins">Poppins (Modern Clean)</option>
                      <option value="playfair">Playfair Display (Elegant Serif)</option>
                      <option value="cinzel">Cinzel (Classical Luxury)</option>
                      <option value="lobster">Lobster (Retro Script)</option>
                      <option value="caveat">Caveat (Creative Handwritten)</option>
                      <option value="spacemono">Space Mono (Retro Code)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                  Direct Public Menu URL
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden pr-2">
                  <input
                    type="text"
                    readOnly
                    value={menuUrl}
                    className="flex-1 bg-transparent border-0 px-4 py-2.5 text-sm text-slate-600 focus:ring-0 focus:outline-none font-sans"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center space-x-1 hover:bg-slate-200/60 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border border-slate-200 font-sans"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 w-full space-y-2">
            {saveSuccess && (
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center animate-fade-in font-sans">
                Settings Saved Successfully!
              </p>
            )}
            {saveError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg text-center animate-fade-in font-sans">
                {saveError}
              </p>
            )}

            <button
              onClick={handleSaveQRSettings}
              disabled={saving}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 font-sans"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save QR Design Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Columns: QR Previews & Printable Flyer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Menu QR Code Preview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center">
              <h2 className="text-md font-semibold text-slate-800 self-start mb-4 flex items-center space-x-2 w-full pb-3 border-b border-slate-100 font-sans">
                <QrCode className="h-4 w-4 text-orange-500" />
                <span>Menu QR Code</span>
              </h2>

              <div
                className="p-6 rounded-2xl border border-slate-100 shadow-sm relative flex flex-col items-center justify-center transition-all duration-300"
                style={{ backgroundColor: bgColor }}
              >
                {qrUrl ? (
                  <>
                    <img
                      src={qrUrl}
                      alt="Menu QR Code"
                      className="h-44 w-44 object-contain"
                    />
                    <span 
                      className="text-xs font-extrabold text-slate-800 mt-2 select-none tracking-tight text-center"
                      style={{ fontFamily: getSelectedFontFamily() }}
                    >
                      {profile?.name} Menu
                    </span>
                  </>
                ) : (
                  <div className="h-44 w-44 bg-slate-50 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={!qrUrl}
                className="mt-6 inline-flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 text-sm font-sans"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG</span>
              </button>
            </div>

            {/* Wi-Fi Connection QR Preview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-between">
              <h2 className="text-md font-semibold text-slate-800 self-start mb-4 flex items-center space-x-2 w-full pb-3 border-b border-slate-100 font-sans">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span>Wi-Fi Connection QR</span>
              </h2>

              {profile?.wifi_ssid ? (
                <>
                  <div
                    className="p-6 rounded-2xl border border-slate-100 shadow-sm relative flex flex-col items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: bgColor }}
                  >
                    {wifiQrUrl ? (
                      <>
                        <img
                          src={wifiQrUrl}
                          alt="Wi-Fi QR Code"
                          className="h-44 w-44 object-contain"
                        />
                        <span 
                          className="text-xs font-extrabold text-slate-800 mt-2 select-none tracking-tight text-center"
                          style={{ fontFamily: getSelectedFontFamily() }}
                        >
                          SSID: {profile.wifi_ssid}
                        </span>
                      </>
                    ) : (
                      <div className="h-44 w-44 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDownloadWifi}
                    disabled={!wifiQrUrl}
                    className="mt-6 inline-flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 text-sm font-sans"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PNG</span>
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center w-full font-sans">
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200 mb-3 text-slate-400">
                    <Sparkles className="h-6 w-6 text-slate-350" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Wi-Fi QR not set up</p>
                  <p className="text-xs text-slate-400 max-w-[200px] mt-1 mb-4">Set up Wi-Fi details in settings to get a scan-to-connect QR code.</p>
                  <a
                    href="/dashboard/settings"
                    className="text-xs font-bold text-orange-600 hover:text-orange-750 border border-orange-200 bg-orange-55/50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Configure in Settings
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Table Tent Card Action Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 w-full font-sans">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-orange-50 border border-orange-100 text-orange-500 rounded-xl mt-1 shrink-0">
                <Printer className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-slate-800">Printable Foldable A4 Tent Card</h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  Generates a double-sided tent card. Cut it out, fold it in the middle, and place it on tables. One side will show your Menu QR code, and the other will show the Wi-Fi QR code (or Menu QR on both sides if Wi-Fi isn't configured).
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={!qrUrl || downloadingPDF}
              className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {downloadingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Downloading Font & PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Download Foldable PDF (A4)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

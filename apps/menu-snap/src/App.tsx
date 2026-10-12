import { ownerHeaders, setSessionToken, clearOwnerToken } from './utils/ownerAuth';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { StyleControlsBar } from './components/StyleControlsBar';
import { MenuInputSection } from './components/MenuInputSection';
import { PhotoStudioGrid } from './components/PhotoStudioGrid';
import { PhotoRetouchModal } from './components/PhotoRetouchModal';
import { ZoomModal } from './components/ZoomModal';
import { DigitalMenuPreview } from './components/DigitalMenuPreview';
import { MenuData, DishItem, PhotoShootConfig, StylePreset, ImageSize } from './types';
import { SAMPLE_MENUS } from './data/sampleMenus';

export default function App() {
  const [loggedIn,setLoggedIn] = useState(false);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loginError,setLoginError] = useState('');
  const [savedMenuId,setSavedMenuId] = useState<string|null>(null);
  const [saveStatus,setSaveStatus] = useState('');
  const login=async()=>{
    setLoginError('');
    try {
      const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Login failed');
      setSessionToken(data.token);setLoggedIn(true);setPassword('');
    }catch(e:any){setLoginError(e.message);}
  };
  const loadLatestMenu=async()=>{
    try {
      const r=await fetch('/api/menus',{headers:ownerHeaders()});if(!r.ok)return;
      const list=await r.json();if(!list.menus?.length)return;
      const entry=list.menus[0];setSavedMenuId(entry.id);
      const menu=structuredClone(entry.payload) as MenuData;
      for(const dish of menu.dishes){
        if(dish.generatedImageUrl?.startsWith('/api/images/')){
          const img=await fetch(dish.generatedImageUrl,{headers:ownerHeaders()});
          if(img.ok){const blob=await img.blob();dish.generatedImageUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
        }
      }
      setCurrentMenu(menu);setSaveStatus('Loaded last saved menu.');
    }catch(e){console.error('Unable to load saved menu',e);}
  };
  const saveMenu=async()=>{
    setSaveStatus('Saving...');
    try {
      const persisted=structuredClone(currentMenu) as MenuData;
      for(const dish of persisted.dishes){
        if(dish.generatedImageUrl?.startsWith('data:image/')){
          const upload=await fetch('/api/images',{method:'POST',headers:{'Content-Type':'application/json',...ownerHeaders()},body:JSON.stringify({dataUrl:dish.generatedImageUrl})});
          const uploaded=await upload.json();if(!upload.ok)throw new Error(uploaded.error||'Image upload failed');
          dish.generatedImageUrl=uploaded.url;
        }
      }
      const url=savedMenuId?`/api/menus/${savedMenuId}`:'/api/menus';
      const response=await fetch(url,{method:savedMenuId?'PATCH':'POST',headers:{'Content-Type':'application/json',...ownerHeaders()},body:JSON.stringify({menu:persisted})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Save failed');
      if(data.id)setSavedMenuId(data.id);
      setSaveStatus('Saved. Review and approve before export.');
    }catch(e:any){setSaveStatus(e.message);}
  };
  const approveMenu=async()=>{
    if(!savedMenuId){setSaveStatus('Save the menu first.');return;}
    const response=await fetch(`/api/menus/${savedMenuId}/approve`,{method:'POST',headers:ownerHeaders()});
    setSaveStatus(response.ok?'Approved. Export is available.':'Approval failed.');
  };
  const exportMenu=async()=>{
    if(!savedMenuId){setSaveStatus('Save and approve the menu first.');return;}
    const response=await fetch(`/api/menus/${savedMenuId}/export`,{headers:ownerHeaders()});
    if(!response.ok){setSaveStatus('Export requires approval.');return;}
    const blob=await response.blob();const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='menu.json';link.click();URL.revokeObjectURL(url);
  };
  // Initialize with sample Italian Trattoria menu for immediate photoshoot preview
  const [currentMenu, setCurrentMenu] = useState<MenuData>(SAMPLE_MENUS[0]);

  // Global photoshoot camera & style settings
  const [config, setConfig] = useState<PhotoShootConfig>({
    globalStyle: 'Rustic/Dark',
    globalSize: '1K',
    globalAspectRatio: '1:1',
    surface: 'Dark Slate',
    depthOfField: 'Cinematic Shallow Macro',
    steam: 'Subtle Steam',
    propLevel: 'Clean Minimal'
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<'studio' | 'digital-menu'>('studio');
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [retouchDish, setRetouchDish] = useState<DishItem | null>(null);
  const [zoomDish, setZoomDish] = useState<DishItem | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // 1. Generate Photo for Single Dish
  const handleGenerateDishPhoto = async (dishId: string) => {
    const dishIndex = currentMenu.dishes.findIndex((d) => d.id === dishId);
    if (dishIndex === -1) return;

    const dish = currentMenu.dishes[dishIndex];

    // Set loading state
    const updatedDishes = [...currentMenu.dishes];
    updatedDishes[dishIndex] = {
      ...dish,
      isGenerating: true,
      generationError: undefined
    };
    setCurrentMenu({ ...currentMenu, dishes: updatedDishes });

    try {
      const res = await fetch('/api/generate-food-photo', {
        headers: { 'Content-Type': 'application/json', ...ownerHeaders() },
method: 'POST',
        body: JSON.stringify({
          dish,
          config
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate food photo');
      }

      const data = await res.json();

      // Update dish with generated photo URL
      const finalDishes = [...currentMenu.dishes];
      finalDishes[dishIndex] = {
        ...finalDishes[dishIndex],
        generatedImageUrl: data.imageUrl,
        isGenerating: false,
        selectedStyle: dish.selectedStyle || config.globalStyle,
        selectedSize: dish.selectedSize || config.globalSize,
        selectedAspectRatio: dish.selectedAspectRatio || config.globalAspectRatio,
        version: (dish.version || 1) + 1
      };

      setCurrentMenu({ ...currentMenu, dishes: finalDishes });
    } catch (err: any) {
      console.error('Photo shoot error:', err);
      const errDishes = [...currentMenu.dishes];
      errDishes[dishIndex] = {
        ...errDishes[dishIndex],
        isGenerating: false,
        generationError: err.message || 'Generation failed'
      };
      setCurrentMenu({ ...currentMenu, dishes: errDishes });
    }
  };

  // 2. Batch Photograph All Dishes
  const handleGenerateAllPhotos = async () => {
    if (isBatchGenerating || currentMenu.dishes.length === 0) return;

    setIsBatchGenerating(true);

    for (let i = 0; i < currentMenu.dishes.length; i++) {
      const dish = currentMenu.dishes[i];
      await handleGenerateDishPhoto(dish.id);
    }

    setIsBatchGenerating(false);
  };

  // 3. Apply Active Style to All Dishes
  const handleApplyStyleToAll = () => {
    const updated = currentMenu.dishes.map((d) => ({
      ...d,
      selectedStyle: config.globalStyle,
      selectedSize: config.globalSize,
      selectedAspectRatio: config.globalAspectRatio
    }));
    setCurrentMenu({ ...currentMenu, dishes: updated });
  };

  // 4. Update individual dish style
  const handleChangeDishStyle = (dishId: string, newStyle: StylePreset) => {
    const updated = currentMenu.dishes.map((d) =>
      d.id === dishId ? { ...d, selectedStyle: newStyle } : d
    );
    setCurrentMenu({ ...currentMenu, dishes: updated });
  };

  // 5. Save retouched image
  const handleSaveRetouchedImage = (dishId: string, newImageUrl: string) => {
    const updated = currentMenu.dishes.map((d) =>
      d.id === dishId ? { ...d, generatedImageUrl: newImageUrl } : d
    );
    setCurrentMenu({ ...currentMenu, dishes: updated });
  };

  React.useEffect(()=>{if(loggedIn)void loadLatestMenu();},[loggedIn]);
  const photographedCount = currentMenu.dishes.filter((d) => !!d.generatedImageUrl).length;

  if(!loggedIn)return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6"><div className="max-w-sm w-full space-y-4">
    <h1 className="text-2xl font-bold">Menu Snap — Sign in</h1>
    <p className="text-sm text-zinc-400">Accounts are created by the administrator. Initial admin setup uses the documented bootstrap API.</p>
    <input aria-label="Email" className="w-full bg-zinc-800 p-3 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input aria-label="Password" type="password" className="w-full bg-zinc-800 p-3 rounded" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <button className="bg-amber-500 text-black p-3 rounded w-full" onClick={login}>Sign in</button>
    {loginError&&<p role="alert" className="text-red-400">{loginError}</p>}
  </div></div>;
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Header */}
      <Header
        restaurantName={currentMenu.restaurantName}
        cuisine={currentMenu.cuisine}
        globalStyle={config.globalStyle}
        globalSize={config.globalSize}
        totalDishes={currentMenu.dishes.length}
        photographedCount={photographedCount}
        onOpenSampleModal={() => setShowSampleModal(true)}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
      />

      <div className="max-w-7xl mx-auto px-4 pt-3 flex flex-wrap gap-2 items-center">
        <button className="bg-amber-500 text-black px-3 py-2 rounded" onClick={saveMenu}>Save menu</button>
        <button className="bg-zinc-700 px-3 py-2 rounded" onClick={approveMenu}>Approve</button>
        <button className="bg-zinc-700 px-3 py-2 rounded" onClick={exportMenu}>Export approved JSON</button>
        <button className="bg-zinc-800 px-3 py-2 rounded" onClick={()=>{clearOwnerToken();setLoggedIn(false);setSavedMenuId(null);}}>Log out</button>
        <span className="text-xs text-zinc-400" role="status">{saveStatus}</span>
      </div>
      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'studio' ? (
          <>
            {/* Restaurant Menu Input & Parser */}
            <MenuInputSection
              currentMenu={currentMenu}
              onUpdateMenu={setCurrentMenu}
            />

            {/* Global Style & Camera Controls Bar */}
            <StyleControlsBar
              config={config}
              onChangeConfig={setConfig}
              onApplyToAllDishes={handleApplyStyleToAll}
            />

            {/* Food Photo Studio Grid */}
            <PhotoStudioGrid
              dishes={currentMenu.dishes}
              config={config}
              onGeneratePhoto={handleGenerateDishPhoto}
              onGenerateAll={handleGenerateAllPhotos}
              isBatchGenerating={isBatchGenerating}
              onOpenRetouchModal={setRetouchDish}
              onOpenZoomModal={setZoomDish}
              onChangeDishStyle={handleChangeDishStyle}
              onOpenDigitalMenu={() => setActiveTab('digital-menu')}
            />
          </>
        ) : (
          /* Digital Menu View */
          <DigitalMenuPreview
            menu={currentMenu}
            onBackToStudio={() => setActiveTab('studio')}
          />
        )}

      </main>

      {/* Retouch Modal */}
      {retouchDish && (
        <PhotoRetouchModal
          dish={retouchDish}
          onClose={() => setRetouchDish(null)}
          onSaveRetouchedImage={handleSaveRetouchedImage}
        />
      )}

      {/* Zoom / High-Res Inspection Modal */}
      {zoomDish && (
        <ZoomModal
          dish={zoomDish}
          config={config}
          onClose={() => setZoomDish(null)}
          onReShoot={handleGenerateDishPhoto}
        />
      )}

      {/* Quick Sample Menu Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Select Sample Restaurant Menu</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Choose a concept to populate dish titles, culinary descriptions, and plating specs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAMPLE_MENUS.map((menu) => (
                <button
                  key={menu.restaurantName}
                  onClick={() => {
                    setCurrentMenu(menu);
                    setShowSampleModal(false);
                  }}
                  className="p-4 bg-zinc-950 border border-zinc-800 hover:border-amber-500 rounded-xl text-left transition group"
                >
                  <span className="text-xs font-bold text-amber-400 block mb-1">{menu.cuisine}</span>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 mb-1">{menu.restaurantName}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{menu.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-5 text-right">
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

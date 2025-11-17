<script>
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { X } from 'svelte-feathers';

    import { 
        Download, 
        Zap, 
        Activity, 
        Target, 
        TrendingUp, 
        CheckCircle, 
        Award, 
        Clock,
        Crosshair,
        Sliders,
        BarChart2,
        Lock,
        Unlock
    } from 'svelte-feathers';

    let mounted = false;
    let lightboxOpen = false;
    let currentScreenshot = null;
    let touchStartX = 0;
    let touchEndX = 0;
    
    const screenshots = [
      {
        id: 1,
        src: "/client/screenshot-1.jpg",
        alt: "a"
      },
      {
        id: 2,
        src: "/client/screenshot-2.jpg",
        alt: "b"
      },
      {
        id: 3,
        src: "/client/screenshot-3.jpg",
        alt: "c"
      }
    ];

    const downloadInfo = {
      url: "https://github.com/refx-online/refxUpdater/releases/"
    };
    
    function openLightbox(screenshot) {
        currentScreenshot = screenshot;
        lightboxOpen = true;
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        lightboxOpen = false;
        document.body.style.overflow = '';
    }
    
    function handleKeydown(event) {
        if (lightboxOpen) {
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                navigateScreenshot(-1);
            } else if (event.key === 'ArrowRight') {
                navigateScreenshot(1);
            }
        }
    }
    
    function navigateScreenshot(direction) {
        if (!currentScreenshot) return;
        
        const currentIndex = screenshots.findIndex(s => s.id === currentScreenshot.id);
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) newIndex = screenshots.length - 1;
        if (newIndex >= screenshots.length) newIndex = 0;
        
        currentScreenshot = screenshots[newIndex];
    }
    
    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
    }
    
    function handleTouchMove(event) {
        touchEndX = event.touches[0].clientX;
    }
    
    function handleTouchEnd() {
        if (lightboxOpen) {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) > 50) {
                if (swipeDistance > 0) {
                    navigateScreenshot(-1);
                } else {
                    navigateScreenshot(1);
                }
            }
        }
    }
    
    onMount(() => {
      mounted = true;
      window.addEventListener('keydown', handleKeydown);
      
      return () => {
        window.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = ''; 
      };
    });
</script>

<svelte:head>
    <title>re;fx :: The Client</title>
</svelte:head>

<div class="client-container min-h-screen relative z-[1] overflow-hidden">
    {#if mounted}
        <div class="absolute inset-0 opacity-10 blur-3xl z-[0]">
            <div class="absolute w-80 h-80 bg-cyan-500/30 rounded-full -top-10 -left-10"></div>
            <div class="absolute w-96 h-96 bg-blue-500/30 rounded-full top-1/3 right-1/4"></div>
            <div class="absolute w-80 h-80 bg-purple-500/30 rounded-full -bottom-20 -right-20"></div>
        </div>
    {/if}

    <div class="container mx-auto px-4 py-16 relative z-[2]">
        <header class="text-center mb-16">
            <div class="flex justify-center mb-4">
                <div class="icon-wrapper">
                    <Zap size="36" color="#06b6d4" />
                </div>
            </div>
            <h1 class="text-5xl font-bold mb-3 text-white">re;fx Client</h1>
        </header>
        
        <section class="description mb-20 text-center mx-auto">
            <div class="flex items-center justify-center mb-6">
                <Activity class="mr-3 text-cyan-400" size="24" />
                <h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">About</h2>
            </div>
            <p class="text-lg max-w-3xl mx-auto text-gray-300 mb-4">
                This client is what makes this server exists. Let's not think that i copied this page from patcher
            </p>
        </section>
        
        <section class="screenshots mb-20">
            <div class="screenshot-grid">
                {#each screenshots as screenshot}
                    <div class="screenshot-card" on:click={() => openLightbox(screenshot)} on:keydown={(e) => e.key === 'Enter' && openLightbox(screenshot)}>
                        <img src={screenshot.src} alt={screenshot.alt} loading="lazy" />
                        <div class="screenshot-overlay">
                            <span class="screenshot-label">{screenshot.alt}</span>
                        </div>
                    </div>
                {/each}
            </div>
            
            {#if lightboxOpen && currentScreenshot}
                <div class="lightbox-overlay" 
                     on:click={closeLightbox} 
                     on:touchstart={handleTouchStart}
                     on:touchmove={handleTouchMove}
                     on:touchend={handleTouchEnd}
                     transition:fade={{ duration: 300 }}>
                    <div class="lightbox-content" 
                         on:click|stopPropagation={() => {}}
                         transition:scale={{ duration: 300, start: 0.95 }}>
                        <img src={currentScreenshot.src} alt={currentScreenshot.alt} />
                        <button class="lightbox-close" on:click={closeLightbox}>
                            <X size="24" color="#fff" />
                        </button>
                        <div class="lightbox-nav">
                            <button class="nav-btn prev" on:click|stopPropagation={() => navigateScreenshot(-1)}>❮</button>
                            <button class="nav-btn next" on:click|stopPropagation={() => navigateScreenshot(1)}>❯</button>
                        </div>
                    </div>
                </div>
            {/if}
        </section>
        
        <section class="download mb-16">
            <div class="download-card">
                <div class="download-content">
                    <a href={downloadInfo.url} class="download-button flex items-center">
                        <Download class="mr-2" size="20" /> Download Updater
                    </a>
                </div>
            </div>
        </section>
        
    </div>

    {#if mounted}
        <div class="absolute bottom-0 left-0 opacity-10 pointer-events-none z-[0]">
            <svg width="200" height="200" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="#06b6d4" opacity="0.2"/>
            </svg>
        </div>
        <div class="absolute top-1/4 right-0 opacity-10 pointer-events-none z-[0]">
            <svg width="250" height="250" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#06b6d4" opacity="0.2"/>
            </svg>
        </div>
    {/if}
</div>
  
<style>
    .client-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #0a0a0a;
        color: #f0f0f0;
        line-height: 1.6;
    }
    
    h1, h2, h3 {
        font-weight: 700;
        letter-spacing: -0.02em;
    }

    .warning-box {
        background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05));
        border: 1px solid rgba(234, 179, 8, 0.3);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        backdrop-filter: blur(10px);
    }

    .screenshot-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
    
    .screenshot-card {
        background-color: #1a1a1a;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), 
                  box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
        position: relative;
    }
    
    .screenshot-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 18px 40px rgba(6, 182, 212, 0.3);
    }
    
    .screenshot-card img {
        width: 100%;
        height: auto;
        display: block;
        transition: transform 0.5s ease, filter 0.3s ease;
    }
    
    .screenshot-card:hover img {
        transform: scale(1.05);
        filter: brightness(1.1);
    }

    .screenshot-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        padding: 1rem;
        transform: translateY(100%);
        transition: transform 0.3s ease;
    }

    .screenshot-card:hover .screenshot-overlay {
        transform: translateY(0);
    }

    .screenshot-label {
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .lightbox-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        margin: auto;
    }
    
    .lightbox-content img {
        max-width: 100%;
        max-height: 85vh;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    
    .lightbox-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease;
    }
    
    .lightbox-close:hover {
        background-color: rgba(6, 182, 212, 0.5);
    }
    
    .lightbox-nav {
        position: absolute;
        width: 100%;
        display: flex;
        justify-content: space-between;
        top: 50%;
        transform: translateY(-50%);
        padding: 0 20px;
    }
    
    .nav-btn {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }
    
    .nav-btn:hover {
        background-color: rgba(6, 182, 212, 0.7);
    }
    
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        max-width: 1200px;
    }

    .feature-card {
        background: linear-gradient(135deg, #1a1a1a, #1e1e1e);
        border: 1px solid rgba(6, 182, 212, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .feature-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #06b6d4, transparent);
        transform: scaleX(0);
        transition: transform 0.3s ease;
    }

    .feature-card:hover::before {
        transform: scaleX(1);
    }

    .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2);
        border-color: rgba(6, 182, 212, 0.5);
    }

    .feature-icon {
        background-color: rgba(6, 182, 212, 0.1);
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .feature-card:hover .feature-icon {
        transform: scale(1.1);
        background-color: rgba(6, 182, 212, 0.2);
    }

    .feature-text {
        color: #d1d1d1;
        font-size: 1rem;
        margin-bottom: 0.75rem;
        line-height: 1.5;
    }

    .feature-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: rgba(6, 182, 212, 0.15);
        color: #06b6d4;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .highlight-card {
        background: linear-gradient(135deg, #1a1a1a, #1e1e1e);
        border: 1px solid rgba(6, 182, 212, 0.3);
        border-radius: 16px;
        padding: 2.5rem;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }

    .highlight-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .highlight-features {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .highlight-features li {
        color: #d1d1d1;
        font-size: 0.95rem;
    }
    
    .icon-wrapper {
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05));
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-bottom: 1rem;
        transition: transform 0.3s ease, background-color 0.3s ease;
        border: 2px solid rgba(6, 182, 212, 0.3);
    }
    
    .icon-wrapper:hover {
        transform: scale(1.1) rotate(5deg);
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(6, 182, 212, 0.1));
    }

    .download-card {
        background: linear-gradient(135deg, #0a4a5a, #1a1a1a);
        border: 1px solid rgba(6, 182, 212, 0.3);
        border-radius: 20px;
        padding: 3rem;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 12px 40px rgba(6, 182, 212, 0.15);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        max-width: 900px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
    }

    .download-card::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
        animation: pulse 4s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }

    .download-content {
        text-align: center;
        position: relative;
        z-index: 1;
    }
    
    .download-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 50px rgba(6, 182, 212, 0.25);
    }
    
    .download-button {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        color: white;
        text-decoration: none;
        padding: 1rem 2.5rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .download-button:hover {
        background: linear-gradient(135deg, #0891b2, #0e7490);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(6, 182, 212, 0.5);
    }
    
    .download-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 10px rgba(6, 182, 212, 0.4);
    }
    
    @media (max-width: 900px) {
        .screenshot-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .features-grid {
            grid-template-columns: 1fr;
        }
        
        .lightbox-content {
            max-width: 95%;
        }
        
        .nav-btn {
            width: 36px;
            height: 36px;
        }
    }
    
    @media (max-width: 600px) {
        h1 {
            font-size: 2.5rem;
        }
        
        .screenshot-grid {
            grid-template-columns: 1fr;
        }

        .highlight-card {
            padding: 1.5rem;
        }

        .highlight-features {
            grid-template-columns: 1fr;
        }
        
        .download-card {
            padding: 2rem 1rem;
        }

        .download-button {
            padding: 0.875rem 1.75rem;
            font-size: 1rem;
        }
        
        .lightbox-content img {
            max-height: 80vh;
        }
        
        .lightbox-close {
            top: -35px;
            right: 0;
        }
        
        .nav-btn {
            width: 32px;
            height: 32px;
            font-size: 16px;
        }
        
        .lightbox-nav {
            padding: 0 10px;
        }
    }
</style>
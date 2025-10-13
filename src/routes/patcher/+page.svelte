<script>
    import { onMount } from 'svelte';
    import { appName } from '$lib/env';
    import { fade, scale } from 'svelte/transition';
    import { X } from 'svelte-feathers';

    import { 
        Download, 
        Coffee, 
        Code, 
        Layout, 
        Shield, 
        CheckCircle, 
        Monitor, 
        Settings, 
        FastForward,
        GitBranch,
        Star
    } from 'svelte-feathers';

    let mounted = false;
    let lightboxOpen = false;
    let currentScreenshot = null;
    let touchStartX = 0;
    let touchEndX = 0;
    
    const screenshots = [
      {
        id: 1,
        src: "/patcher/screenshot-1.jpg",
        alt: "g"
      },
      {
        id: 2,
        src: "/patcher/screenshot-2.png",
        alt: "a"
      },
      {
        id: 3,
        src: "/patcher/screenshot-3.jpg",
        alt: "rl"
      }
    ];

    const downloadInfo = {
      url: "https://github.com/refx-online/patcher-cli/releases/tag/v0.0.3"
    };
    
    const features = [
        {
            text: "Enable Relax/Autopilot Miss (wow! who would've thought)",
            icon: CheckCircle
        },
        {
            text: "Enable Relax/Autopilot Combo Miss",
            icon: Monitor
        },
        {
            text: "Show Relax/Autopilot Ranking Panel",
            icon: Layout
        },
        {
            text: "Faster Transition",
            icon: FastForward
        },
        {
            text: "This fuckshit is not for the cheat leaderboard!",
            icon: GitBranch
        },
        {
            text: "Totally not a crypto miner!",
            icon: Settings
        },
        {
            text: "And more in the future!",
            icon: Star
        }
    ];
    
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
    <title>{appName} :: Patcher</title>
</svelte:head>

<div class="patcher-container min-h-screen relative z-[1] overflow-hidden">
    {#if mounted}
        <div class="absolute inset-0 opacity-10 blur-3xl z-[0]">
            <div class="absolute w-80 h-80 bg-purple-500/30 rounded-full -top-10 -left-10"></div>
            <div class="absolute w-96 h-96 bg-indigo-500/30 rounded-full -bottom-20 -right-20"></div>
        </div>
    {/if}

    <div class="container mx-auto px-4 py-16 relative z-[2]">
        <header class="text-center mb-16">
            <div class="flex justify-center mb-4">
                <div class="icon-wrapper">
                    <Code size="36" color="#8b5cf6" />
                </div>
            </div>
            <h1 class="text-5xl font-bold mb-3 text-white">re;fx Patcher</h1>
        </header>
        
        <section class="description mb-20 text-center mx-auto">
            <div class="flex items-center justify-center mb-6">
                <Coffee class="mr-3 text-purple-500" size="24" />
                <h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">About</h2>
            </div>
            <p class="text-lg max-w-3xl mx-auto text-gray-300">
                re;fx Patcher is an osu! patcher designed to enhance the relax experience with features that osu! should already have included. 
            </p>
        </section>
        
        <section class="screenshots mb-20">
            <div class="screenshot-grid">
                {#each screenshots as screenshot}
                    <div class="screenshot-card" on:click={() => openLightbox(screenshot)} on:keydown={(e) => e.key === 'Enter' && openLightbox(screenshot)}>
                        <img src={screenshot.src} alt={screenshot.alt} loading="lazy" />
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
        
        <section class="features mb-20">
            <div class="flex items-center justify-center mb-8">
                <Shield class="mr-3 text-purple-500" size="24" />
                <h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">Key Features</h2>
            </div>
            <ul class="feature-list mx-auto">
                {#each features as feature}
                    <li class="flex items-center">
                        <span class="icon-feature mr-3">
                            <svelte:component this={feature.icon} size="18" color="#8b5cf6" />
                        </span>
                        {feature.text}
                    </li>
                {/each}
            </ul>
        </section>
        
        <section class="download mb-16">
            <div class="download-card">
                <a href={downloadInfo.url} class="download-button flex items-center">
                    <Download class="mr-2" size="18" /> Download Patcher
                </a>
            </div>
        </section>
        
    </div>

    {#if mounted}
        <div class="absolute bottom-0 left-0 opacity-10 pointer-events-none z-[0]">
            <svg width="200" height="200" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="#8b5cf6" opacity="0.2"/>
            </svg>
        </div>
        <div class="absolute top-0 right-0 opacity-10 pointer-events-none z-[0]">
            <svg width="250" height="250" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#8b5cf6" opacity="0.2"/>
            </svg>
        </div>
    {/if}
</div>
  
<style>
    .patcher-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #121212;
        color: #f0f0f0;
        line-height: 1.6;
    }
    
    h1, h2, h3 {
        font-weight: 700;
        letter-spacing: -0.02em;
    }

    .screenshot-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
    
    .screenshot-card {
        background-color: #1e1e1e;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), 
                  box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
    }
    
    .screenshot-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 18px 30px rgba(0, 0, 0, 0.4);
    }
    
    .screenshot-card img {
        width: 100%;
        height: auto;
        display: block;
        transition: transform 0.5s ease;
    }
    
    .screenshot-card:hover img {
        transform: scale(1.03);
    }
    
    .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
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
        background-color: rgba(139, 92, 246, 0.5);
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
        background-color: rgba(139, 92, 246, 0.7);
    }
    
    .feature-list {
        list-style-type: none;
        padding: 0;
        max-width: 800px;
    }
    
    .feature-list li {
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        background-color: #1e1e1e;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        position: relative;
        transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
        color: #d1d1d1;
        display: flex;
        align-items: center;
    }
    
    .feature-list li:hover {
        transform: translateX(8px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        background-color: #2a2a2a;
    }
    
    .icon-wrapper {
        background-color: rgba(139, 92, 246, 0.1);
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-bottom: 1rem;
        transition: transform 0.3s ease, background-color 0.3s ease;
    }
    
    .icon-wrapper:hover {
        transform: scale(1.1);
        background-color: rgba(139, 92, 246, 0.2);
    }
    
    .icon-feature {
        background-color: rgba(139, 92, 246, 0.1);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: transform 0.3s ease;
    }
    
    .feature-list li:hover .icon-feature {
        transform: scale(1.1);
    }
    
    .icon-footer {
        background-color: rgba(255, 255, 255, 0.05);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: transform 0.3s ease, background-color 0.3s ease;
    }
    
    .icon-footer:hover {
        transform: scale(1.1);
        background-color: rgba(139, 92, 246, 0.1);
    }

    .download-card {
        background: linear-gradient(135deg, #1e1e1e, #2a2a2a);
        border-radius: 16px;
        padding: 3rem;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .download-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    
    .download-button {
        background-color: #8b5cf6;
        color: white;
        text-decoration: none;
        padding: 1rem 2.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        display: flex;
        align-items: center;
    }
    
    .download-button:hover {
        background-color: #7c3aed;
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(139, 92, 246, 0.4);
    }
    
    .download-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }
    
    @media (max-width: 900px) {
        .screenshot-grid {
            grid-template-columns: repeat(2, 1fr);
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
        
        .download-card {
            padding: 2rem 1rem;
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
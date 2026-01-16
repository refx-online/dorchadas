<script>
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { X } from 'svelte-feathers';

    import {
        Download,
        Zap,
        Check,
        AlertCircle,
        TrendingUp,
        Users,
        Tool,
        Server,
        Grid
    } from 'svelte-feathers';

    let mounted = false;
    let lightboxOpen = false;
    let currentScreenshot = null;
    let touchStartX = 0;
    let touchEndX = 0;

    const screenshots = [
      {
        id: 1,
        src: "/lazer/screenshot-1.jpg",
        alt: "a"
      },
      {
        id: 2,
        src: "/lazer/screenshot-2.jpg",
        alt: "b"
      },
      {
        id: 3,
        src: "/lazer/screenshot-3.jpg",
        alt: "c"
      }
    ];

    const downloadInfo = {
      url: "https://github.com/refx-online/osu/releases/"
    };

    const workingStuff = [
        "Score Submission - yeah it works",
        "In-game Leaderboards - see your scores",
        "User Profiles - basic stuff",
        "Beatmap Downloads - grab maps directly",
        "PP Calculation - it obviously works (even rate change!)"
    ];

    const notWorkingYet = [
        "Multiplayer - coming when i feel like it",
        "Chat System - kinda wonky rn but someday",
        "Friends List - also someday maybe",
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
    <title>re;fx :: lazer</title>
</svelte:head>

<div class="lazer-container min-h-screen relative z-[1] overflow-hidden">
    {#if mounted}
        <div class="absolute inset-0 opacity-10 blur-3xl z-[0]">
            <div class="absolute w-96 h-96 bg-pink-500/30 rounded-full -top-10 -left-10"></div>
            <div class="absolute w-80 h-80 bg-rose-500/30 rounded-full top-1/2 right-1/3"></div>
            <div class="absolute w-96 h-96 bg-red-500/30 rounded-full -bottom-20 -right-20"></div>
        </div>
    {/if}

    <div class="container mx-auto px-4 py-16 relative z-[2]">
        <header class="text-center mb-16">
            <div class="flex justify-center mb-4">
                <div class="icon-wrapper">
                    <Zap size="36" color="#ec4899" />
                </div>
            </div>
            <h1 class="text-5xl font-bold mb-3 text-white">osu!lazer</h1>
            <p class="text-xl text-gray-400 mt-4">it somehow works!</p>
        </header>

        <section class="description mb-20 text-center mx-auto">
            <div class="flex items-center justify-center mb-6">
                <Server class="mr-3 text-pink-400" size="24" />
                <h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">what's this</h2>
            </div>
            <p class="text-lg max-w-3xl mx-auto text-gray-300 mb-4">
                so basically this is osu!lazer but connected to this server.
            </p>
            <p class="text-base max-w-2xl mx-auto text-gray-400">
                lazer is still being ACTIVELY developed by the osu! team, and this server support is... a WORK in progress.
                but the important stuff works, so you can actually play and submit scores.
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

        <section class="status mb-20">
            <div class="flex items-center justify-center mb-8">
                <Tool class="mr-3 text-pink-400" size="24" />
                <h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">what works (and what doesn't)</h2>
            </div>

            <div class="status-grid">
                <div class="status-box working">
                    <div class="status-header">
                        <Check size="24" class="text-green-400" />
                        <h3 class="text-xl font-bold text-white ml-3">Actually Working</h3>
                    </div>
                    <ul class="status-list">
                        {#each workingStuff as item}
                            <li>
                                <Check size="16" class="inline mr-2 text-green-400 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        {/each}
                    </ul>
                    <p class="status-note">the stuff that matters basically</p>
                </div>

                <div class="status-box not-working">
                    <div class="status-header">
                        <AlertCircle size="24" class="text-orange-400" />
                        <h3 class="text-xl font-bold text-white ml-3">Not Done Yet</h3>
                    </div>
                    <ul class="status-list">
                        {#each notWorkingYet as item}
                            <li>
                                <AlertCircle size="16" class="inline mr-2 text-orange-400 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        {/each}
                    </ul>
                    <p class="status-note">eventually™</p>
                </div>
            </div>
        </section>

        <section class="info mb-20">
            <div class="info-card">
                <Grid size="28" class="text-pink-400 mb-4" />
                <h3 class="text-2xl font-bold text-white mb-3">why lazer tho</h3>
                <p class="text-gray-300 mb-3">
                    i was bored and i figured i have a free will
                </p>
                <p class="text-gray-300 mb-3">
                    this server tries to support it as much as possible but some features are still WIP because im too god damn lazy
                </p>
                <p class="text-gray-400 text-sm">
                    (also yes i know the UI looks similar to the patcher and refx client page. it's called being consistent ok)
                </p>
                <p class="text-gray-400 text-sm">
                    (also why did i even put more effort to this page)
                </p>
            </div>
        </section>

        <section class="download mb-16">
            <div class="download-card">
                <div class="download-content">
                    <a href={downloadInfo.url} class="download-button">
                        <Download class="mr-2" size="20" /> Download the client
                    </a>
                </div>
            </div>
        </section>

    </div>

    {#if mounted}
        <div class="absolute bottom-0 left-0 opacity-10 pointer-events-none z-[0]">
            <svg width="200" height="200" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="#ec4899" opacity="0.2"/>
            </svg>
        </div>
        <div class="absolute top-1/3 right-0 opacity-10 pointer-events-none z-[0]">
            <svg width="250" height="250" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#ec4899" opacity="0.2"/>
            </svg>
        </div>
    {/if}
</div>

<style>
    .lazer-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #0a0a0a;
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
        background-color: #1a1a1a;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
    }

    .screenshot-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 18px 40px rgba(236, 72, 153, 0.3);
    }

    .screenshot-card img {
        width: 100%;
        height: auto;
        display: block;
        transition: transform 0.5s ease;
    }

    .screenshot-card:hover img {
        transform: scale(1.05);
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
        background-color: rgba(236, 72, 153, 0.5);
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
        background-color: rgba(236, 72, 153, 0.7);
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
        max-width: 1000px;
        margin: 0 auto;
    }

    .status-box {
        background: linear-gradient(135deg, #1a1a1a, #1e1e1e);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .status-box.working {
        border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .status-box.not-working {
        border: 1px solid rgba(251, 146, 60, 0.3);
    }

    .status-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .status-list {
        list-style: none;
        padding: 0;
        margin-bottom: 1rem;
    }

    .status-list li {
        display: flex;
        align-items: flex-start;
        padding: 0.75rem 0;
        color: #d1d1d1;
        line-height: 1.5;
    }

    .status-note {
        color: #888;
        font-size: 0.9rem;
        font-style: italic;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-card {
        background: linear-gradient(135deg, #1a1a1a, #1e1e1e);
        border: 1px solid rgba(236, 72, 153, 0.3);
        border-radius: 16px;
        padding: 2.5rem;
        max-width: 900px;
        margin: 0 auto;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }

    .icon-wrapper {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05));
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-bottom: 1rem;
        transition: transform 0.3s ease;
        border: 2px solid rgba(236, 72, 153, 0.3);
    }

    .icon-wrapper:hover {
        transform: scale(1.1) rotate(-5deg);
    }

    .download-card {
        background: linear-gradient(135deg, #4a1a3a, #1a1a1a);
        border: 1px solid rgba(236, 72, 153, 0.3);
        border-radius: 20px;
        padding: 3rem;
        box-shadow: 0 12px 40px rgba(236, 72, 153, 0.15);
        max-width: 900px;
        margin: 0 auto;
    }

    .download-content {
        text-align: center;
    }

    .download-button {
        background: linear-gradient(135deg, #ec4899, #db2777);
        color: white;
        text-decoration: none;
        padding: 1rem 2.5rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .download-button:hover {
        background: linear-gradient(135deg, #db2777, #be185d);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(236, 72, 153, 0.5);
    }

    .download-button:active {
        transform: translateY(1px);
    }

    @media (max-width: 900px) {
        .screenshot-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .status-grid {
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

        .info-card {
            padding: 1.5rem;
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
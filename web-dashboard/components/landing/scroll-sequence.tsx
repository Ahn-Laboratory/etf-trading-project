"use client"

import React, { useEffect, useRef, useState } from "react"
import { useScroll, useTransform, useSpring } from "framer-motion"

interface ScrollSequenceProps {
    frameCount: number
}

const ScrollSequence: React.FC<ScrollSequenceProps> = ({ frameCount }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [images, setImages] = useState<HTMLImageElement[]>([])
    const [loadedCount, setLoadedCount] = useState(0)
    const { scrollYProgress } = useScroll()

    // Preload images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages: HTMLImageElement[] = []
            let loaded = 0

            for (let i = 0; i < frameCount; i++) {
                const img = new Image()
                const paddedIndex = i.toString().padStart(3, "0")
                img.src = `https://tewteosuadhgdoxwomyj.supabase.co/storage/v1/object/public/Snowball/frame_${paddedIndex}_delay-0.2s.webp`

                img.onload = () => {
                    loaded++
                    setLoadedCount(loaded)
                }
                loadedImages.push(img)
            }
            setImages(loadedImages)
        }

        loadImages()
    }, [frameCount])

    // Draw frame on canvas
    const renderFrame = (index: number) => {
        const canvas = canvasRef.current
        const context = canvas?.getContext("2d")
        const img = images[index]

        if (!context || !canvas || !img) return

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate aspect ratios for cover effect
        const canvasRatio = canvas.width / canvas.height
        const imgRatio = img.width / img.height

        let drawWidth, drawHeight, offsetX, offsetY

        if (imgRatio > canvasRatio) {
            drawHeight = canvas.height
            drawWidth = img.width * (canvas.height / img.height)
            offsetX = (canvas.width - drawWidth) / 2
            offsetY = 0
        } else {
            drawWidth = canvas.width
            drawHeight = img.height * (canvas.width / img.width)
            offsetX = 0
            offsetY = (canvas.height - drawHeight) / 2
        }

        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
    }

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth
                canvasRef.current.height = window.innerHeight
                // Re-render current frame if possible, or just wait for next scroll update
                // We'll rely on the scroll listener loop for simplicity or trigger a re-render
            }
        }

        window.addEventListener("resize", handleResize)
        handleResize() // Initial sizing

        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Sync with scroll
    useEffect(() => {
        // We can use a requestAnimationFrame loop or just listen to scroll change
        // Framer Motion's onChange is handy
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            if (images.length === 0) return

            const frameIndex = Math.min(
                frameCount - 1,
                Math.floor(latest * (frameCount - 1))
            )

            requestAnimationFrame(() => renderFrame(frameIndex))
        })

        return () => unsubscribe()
    }, [scrollYProgress, images, frameCount])

    // Initial Render after loading
    useEffect(() => {
        if (loadedCount > 0 && images.length > 0) {
            requestAnimationFrame(() => renderFrame(0))
        }
    }, [loadedCount, images])

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 z-0 h-screen w-full bg-black">
            {loadedCount < frameCount && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black text-white/50 text-sm">
                    Loading... {Math.round((loadedCount / frameCount) * 100)}%
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="block w-full h-full object-cover"
            />
        </div>
    )
}

export default ScrollSequence

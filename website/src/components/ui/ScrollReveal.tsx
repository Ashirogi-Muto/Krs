'use client'

import { useEffect } from 'react'

/**
 * Intelligent ScrollReveal Observer replicated from Yodha 2.0 scroll experience:
 * - Observes .reveal, .reveal-left, .reveal-right, .reveal-scale, .tech-card, .aurix-card
 * - Staggers grid items automatically
 * - MutationObserver watches for Next.js route transitions and dynamic content
 */
export function ScrollReveal() {
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          obs.unobserve(entry.target)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    })

    const attach = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        '.reveal, .reveal-left, .reveal-right, .reveal-scale, [data-reveal]'
      )
      elements.forEach((el, index) => {
        if (!el.classList.contains('in-view')) {
          // Add automatic micro-stagger if part of a sibling group
          if (el.parentElement && el.parentElement.children.length > 1 && !el.style.transitionDelay) {
            const siblingIndex = Array.from(el.parentElement.children).indexOf(el)
            if (siblingIndex > 0 && siblingIndex < 8) {
              el.style.transitionDelay = `${siblingIndex * 0.08}s`
            }
          }
          observer.observe(el)
        }
      })
    }

    attach()

    // MutationObserver to auto-wire new elements on client route changes
    const mutObs = new MutationObserver(() => {
      attach()
    })

    mutObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutObs.disconnect()
    }
  }, [])

  return null
}

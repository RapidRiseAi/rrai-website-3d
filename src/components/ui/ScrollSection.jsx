import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollSection({ title, body, index }) {
  const sectionRef = useRef()
  const headingRef = useRef()
  const paraRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        x: index % 2 === 0 ? -80 : 80,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      })
      gsap.from(paraRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [index])

  return (
    <section
      ref={sectionRef}
      className="section"
      style={{ justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end' }}
    >
      <div className="section__inner" style={{ textAlign: index % 2 === 0 ? 'left' : 'right' }}>
        <h2 ref={headingRef} style={{ marginBottom: '1rem' }}>{title}</h2>
        <p ref={paraRef}>{body}</p>
      </div>
    </section>
  )
}

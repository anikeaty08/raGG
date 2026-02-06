'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField() {
  const ref = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const positions = new Float32Array(3000 * 3)
    const colors = new Float32Array(3000 * 3)

    const colorPalette = [
      [0.054, 0.647, 0.913], // Cyan
      [0.545, 0.361, 0.965], // Purple
      [0.024, 0.714, 0.831], // Teal
      [0.976, 0.451, 0.086], // Orange
      [0.94, 0.282, 0.529],  // Pink
    ]

    for (let i = 0; i < 3000; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 20
      positions[i3 + 1] = (Math.random() - 0.5) * 20
      positions[i3 + 2] = (Math.random() - 0.5) * 20

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i3] = color[0]
      colors[i3 + 1] = color[1]
      colors[i3 + 2] = color[2]
    }

    return { positions, colors }
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.02
      ref.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <Points ref={ref} positions={particles.positions} colors={particles.colors}>
      <PointMaterial
        transparent
        vertexColors
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  )
}

function FloatingOrb({ position, color, speed }: { position: [number, number, number], color: string, speed: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5
      ref.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * speed * 0.5) * 0.3
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  )
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-0 opacity-50">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <ParticleField />
        <FloatingOrb position={[-3, 2, -2]} color="#0ea5e9" speed={0.8} />
        <FloatingOrb position={[3, -1, -3]} color="#8b5cf6" speed={1.2} />
        <FloatingOrb position={[0, 0, -4]} color="#06b6d4" speed={1} />
        <FloatingOrb position={[-2, -2, -2]} color="#f97316" speed={0.6} />
        <FloatingOrb position={[2, 2, -3]} color="#ec4899" speed={0.9} />
      </Canvas>
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'crypto'

function hashPassword(password: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, name, phone } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Create user
        const hashedPassword = hashPassword(password)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
            },
        })

        // Generate a simple token (in production, use JWT)
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

        return NextResponse.json({
            user,
            token,
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
import { NextResponse, NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await getPayload({ config })
    
    // Get current user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Parse the token and get user
    const token = authHeader.replace('Bearer ', '')
    let user: any = null
    try {
      const result = await payload.auth({ headers: new Headers({ authorization: `Bearer ${token}` }) })
      user = result.user
    } catch {
      return NextResponse.json(
        { error: 'Ungültiges Token' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationId, message } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organisation ID fehlt' },
        { status: 400 }
      )
    }

    // Get the organization
    const org = await payload.findByID({
      collection: 'organizations',
      id: organizationId,
      depth: 0,
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organisation nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if user already has a pending request
    const existingRequests = (org as any).membershipRequests || []
    const existingRequest = existingRequests.find((r: any) => {
      const reqUserId = typeof r.user === 'object' ? r.user.id : r.user
      return reqUserId === user.id && r.status === 'pending'
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Du hast bereits eine ausstehende Anfrage für diese Organisation' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const userOrgs = user.organizations || []
    const userOrgIds = userOrgs.map((o: any) => typeof o === 'object' ? o.id : o)
    if (userOrgIds.includes(organizationId)) {
      return NextResponse.json(
        { error: 'Du bist bereits Mitglied dieser Organisation' },
        { status: 400 }
      )
    }

    // Add the membership request
    const newRequest = {
      user: user.id,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      message: message || '',
    }

    await payload.update({
      collection: 'organizations',
      id: organizationId,
      data: {
        membershipRequests: [...existingRequests, newRequest],
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Mitgliedschaftsanfrage wurde gesendet',
    })

  } catch (error) {
    console.error('Error requesting membership:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

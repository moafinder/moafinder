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

    // Only admins and editors can approve/reject
    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { organizationId, userId, action } = body

    if (!organizationId || !userId || !action) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Ungültige Aktion' },
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

    // Find the membership request
    const existingRequests = (org as any).membershipRequests || []
    const requestIndex = existingRequests.findIndex((r: any) => {
      const reqUserId = typeof r.user === 'object' ? r.user.id : r.user
      return reqUserId === userId && r.status === 'pending'
    })

    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Update the request status
    const updatedRequests = [...existingRequests]
    updatedRequests[requestIndex] = {
      ...updatedRequests[requestIndex],
      status: action === 'approve' ? 'approved' : 'rejected',
    }

    await payload.update({
      collection: 'organizations',
      id: organizationId,
      data: {
        membershipRequests: updatedRequests,
      },
      overrideAccess: true,
    })

    // If approved, add user to the organization
    if (action === 'approve') {
      const targetUser = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      })

      if (targetUser) {
        const currentOrgs = (targetUser as any).organizations || []
        const orgIds = currentOrgs.map((o: any) => typeof o === 'object' ? o.id : o)
        
        if (!orgIds.includes(organizationId)) {
          await payload.update({
            collection: 'users',
            id: userId,
            data: {
              organizations: [...orgIds, organizationId],
            },
            overrideAccess: true,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Mitgliedschaftsanfrage wurde genehmigt' 
        : 'Mitgliedschaftsanfrage wurde abgelehnt',
    })

  } catch (error) {
    console.error('Error handling membership request:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * Script to assign all organizations to admin user and update related entities
 * 
 * This script:
 * 1. Finds the admin user (first user with role 'admin')
 * 2. Sets the admin user as owner of all organizations
 * 3. Assigns admin user to all organizations (user.organizations)
 * 4. Assigns all locations to all organizations they're not already part of (from admin's orgs)
 * 
 * Usage: npx tsx ./scripts/assign-orgs-to-admin.ts
 * 
 * Requires DATABASE_URI environment variable to be set.
 */

import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb'

const DATABASE_URI = process.env.DATABASE_URI

if (!DATABASE_URI) {
  console.error('DATABASE_URI environment variable is required')
  process.exit(1)
}

async function main() {
  console.log('Connecting to MongoDB...')
  const client = new MongoClient(DATABASE_URI!)
  
  try {
    await client.connect()
    console.log('Connected successfully')
    
    const db = client.db()
    
    // Find admin user
    console.log('\n1. Finding admin user...')
    const adminUser = await db.collection('users').findOne({ role: 'admin' })
    
    if (!adminUser) {
      console.error('No admin user found! Please create an admin user first.')
      process.exit(1)
    }
    
    console.log(`   Found admin: ${adminUser.email} (ID: ${adminUser._id})`)
    
    // Get all organizations
    console.log('\n2. Getting all organizations...')
    const organizations = await db.collection('organizations').find({}).toArray()
    console.log(`   Found ${organizations.length} organizations`)
    
    // Set admin as owner of all organizations
    console.log('\n3. Setting admin as owner of all organizations...')
    const ownerUpdateResult = await db.collection('organizations').updateMany(
      {},
      { $set: { owner: adminUser._id } }
    )
    console.log(`   Updated ${ownerUpdateResult.modifiedCount} organizations`)
    
    // Assign all organizations to admin user
    console.log('\n4. Assigning all organizations to admin user...')
    const orgIds = organizations.map(org => org._id)
    const userUpdateResult = await db.collection('users').updateOne(
      { _id: adminUser._id },
      { $set: { organizations: orgIds } }
    )
    console.log(`   Updated admin user: ${userUpdateResult.modifiedCount ? 'success' : 'no change needed'}`)
    
    // Get all locations
    console.log('\n5. Getting all locations...')
    const locations = await db.collection('locations').find({}).toArray()
    console.log(`   Found ${locations.length} locations`)
    
    // If there's at least one organization, assign all locations to the first one if they have none
    if (organizations.length > 0) {
      console.log('\n6. Checking locations without organizations...')
      const firstOrgId = organizations[0]._id
      
      let locationsUpdated = 0
      for (const location of locations) {
        const existingOrgs = location.organizations || []
        if (existingOrgs.length === 0) {
          await db.collection('locations').updateOne(
            { _id: location._id },
            { $set: { organizations: [firstOrgId] } }
          )
          locationsUpdated++
        }
      }
      console.log(`   Assigned ${locationsUpdated} locations without orgs to "${organizations[0].name}"`)
    }
    
    // Show all admin users and ensure they belong to all orgs
    console.log('\n7. Assigning all organizations to all admin users...')
    const adminUsers = await db.collection('users').find({ role: 'admin' }).toArray()
    for (const admin of adminUsers) {
      const updateResult = await db.collection('users').updateOne(
        { _id: admin._id },
        { $set: { organizations: orgIds } }
      )
      console.log(`   ${admin.email}: ${updateResult.modifiedCount ? 'updated' : 'already up to date'}`)
    }
    
    console.log('\n✅ Done!')
    console.log('\nSummary:')
    console.log(`   - Admin users: ${adminUsers.length}`)
    console.log(`   - Organizations (all owned by admin): ${organizations.length}`)
    console.log(`   - Locations: ${locations.length}`)
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\nConnection closed.')
  }
}

main()

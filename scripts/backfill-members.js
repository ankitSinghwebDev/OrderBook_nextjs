#!/usr/bin/env node
// Backfill workspaceMembers from users collection (legacy workspaceId/isCreator fields)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/mongodb.js';
import User from '../src/models/User.js';
import WorkspaceMember from '../src/models/WorkspaceMember.js';

async function run() {
  await connectDB();
  const cursor = User.find({ workspaceId: { $exists: true, $ne: '' } }).cursor();
  let processed = 0;
  let created = 0;
  for await (const user of cursor) {
    const role = user.role || 'viewer';
    const isOwner = !!user.isCreator;
    const res = await WorkspaceMember.findOneAndUpdate(
      { workspaceId: user.workspaceId, userId: user._id },
      {
        workspaceId: user.workspaceId,
        userId: user._id,
        role,
        isOwner,
        joinedAt: user.createdAt || new Date(),
      },
      { upsert: true, new: true }
    );
    if (res.wasNew) created += 1; // not available; ignore
    processed += 1;
  }
  console.log('Backfill complete. processed users:', processed, 'memberships upserted');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

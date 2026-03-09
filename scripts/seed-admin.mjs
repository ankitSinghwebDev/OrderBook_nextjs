import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/mongodb.js';
import User from '../src/models/User.js';
import Workspace from '../src/models/Workspace.js';
import WorkspaceMember from '../src/models/WorkspaceMember.js';

function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }
  return code;
}

async function uniqueWorkspaceId() {
  while (true) {
    const candidate = crypto.randomBytes(6).toString('hex');
    const exists = await Workspace.exists({ workspaceId: candidate });
    if (!exists) return candidate;
  }
}

async function uniqueJoinCode() {
  while (true) {
    const code = generateCode(6);
    const exists = await Workspace.exists({ joinCode: code });
    if (!exists) return code;
  }
}

async function main() {
  const email = process.env.SEED_EMAIL || 'admin@example.com';
  const password = process.env.SEED_PASSWORD || 'ChangeMe123';
  const name = process.env.SEED_NAME || 'Admin';
  const company = process.env.SEED_COMPANY || 'Workspace';
  const address = process.env.SEED_ADDRESS || 'Address';

  await connectDB();

  let user = await User.findOne({ email });
  if (user) {
    console.log('User already exists:', email);
    await mongoose.disconnect();
    return;
  }

  const workspaceId = await uniqueWorkspaceId();
  const joinCode = await uniqueJoinCode();
  const passwordHash = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    phoneNumber: '',
    companyName: company,
    companyAddress: address,
    role: 'admin',
    isCreator: true,
    workspaceId,
    passwordHash,
  });

  const workspace = await Workspace.create({
    name: company,
    workspaceId,
    joinCode,
    ownerUserId: user._id,
    membersCount: 1,
  });

  await WorkspaceMember.create({
    workspaceId,
    userId: user._id,
    role: 'admin',
    isOwner: true,
    joinedAt: new Date(),
  });

  console.log('Seeded admin user.');
  console.log({ email, password, workspaceId, joinCode });
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

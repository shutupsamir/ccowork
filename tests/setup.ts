import { vi } from 'vitest';

// Mock PrismaClient factory
// Returns an object with all common Prisma model methods mocked
function createMockPrismaModel() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
  };
}

export const mockPrisma = {
  matchRequest: createMockPrismaModel(),
  session: createMockPrismaModel(),
  sessionParticipant: createMockPrismaModel(),
  videoRoom: createMockPrismaModel(),
  user: createMockPrismaModel(),
  userBlocklist: createMockPrismaModel(),
  $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
    // By default, execute the callback with the same mock prisma
    // Tests can override this behavior
    return fn(mockPrisma);
  }),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// Mock the db module so any import of prisma gets the mock
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

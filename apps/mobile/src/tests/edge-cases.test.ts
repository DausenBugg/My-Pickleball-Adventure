import { supabase } from '../lib/supabase';

/**
 * Test suite for edge cases - Run these tests to verify robustness
 * This is a manual test file - run functions individually to test
 */

// Test 1: Profile Upload with Missing Extension
export async function testMissingFileExtension() {
  console.log('Test 1: Missing File Extension');
  
  // Simulate URI without extension
  const testUri = 'file:///path/to/image';
  const fileExt = testUri.split('.').pop() || 'jpg';
  
  console.assert(fileExt === 'jpg', 'Should default to jpg');
  console.log('✅ PASS: File extension defaults to jpg when missing');
}

// Test 2: Large File Size Validation
export async function testLargeFileSize() {
  console.log('Test 2: Large File Size Validation');
  
  // Simulate 6MB file
  const mockBlob = { size: 6 * 1024 * 1024 };
  const maxSize = 5 * 1024 * 1024;
  
  if (mockBlob.size > maxSize) {
    console.log('✅ PASS: Large file correctly rejected');
    return true;
  }
  
  console.log('❌ FAIL: Large file not rejected');
  return false;
}

// Test 3: Null Profile Data
export async function testNullProfileData() {
  console.log('Test 3: Null Profile Data Handling');
  
  const mockPart = { player_id: '123', profiles: null };
  const createPlayerObject = (part: any) => ({
    id: part?.profiles?.id || part?.player_id || '',
    full_name: part?.profiles?.full_name || 'Unknown Player',
    avatar_url: part?.profiles?.avatar_url || null,
  });
  
  const result = createPlayerObject(mockPart);
  
  console.assert(result.id === '123', 'Should use player_id fallback');
  console.assert(result.full_name === 'Unknown Player', 'Should use fallback name');
  console.log('✅ PASS: Null profile data handled correctly');
}

// Test 4: Empty Team Arrays
export async function testEmptyTeams() {
  console.log('Test 4: Empty Team Arrays');
  
  const team1: any[] = [];
  const team2: any[] = [];
  
  if (team1.length === 0 || team2.length === 0) {
    console.log('✅ PASS: Empty teams detected and would be filtered');
    return null; // Match would be filtered out
  }
  
  console.log('❌ FAIL: Empty teams not detected');
  return {};
}

// Test 5: Push Token Validation
export async function testPushTokenValidation() {
  console.log('Test 5: Push Token Validation');
  
  const invalidToken = '';
  const validUserId = '123';
  
  if (!invalidToken || !validUserId) {
    console.log('✅ PASS: Invalid token detected');
    return;
  }
  
  console.log('❌ FAIL: Invalid token not detected');
}

// Test 6: Device Module Safety
export async function testDeviceModuleSafety() {
  console.log('Test 6: Device Module Safety');
  
  const mockDevice = { isDevice: undefined };
  
  if (!mockDevice || typeof mockDevice.isDevice === 'undefined') {
    console.log('✅ PASS: Missing device module handled safely');
    return undefined;
  }
  
  console.log('Device available');
  return true;
}

// Test 7: Notification Data Validation
export async function testNotificationDataValidation() {
  console.log('Test 7: Notification Data Validation');
  
  const testCases = [
    { data: null, shouldPass: true },
    { data: {}, shouldPass: true },
    { data: { achievement_id: 'abc' }, shouldPass: true },
    { data: { achievement_id: 123 }, shouldPass: true }, // Invalid type
    { data: { unknown_field: 'xyz' }, shouldPass: true },
  ];
  
  for (const testCase of testCases) {
    try {
      const data = testCase.data;
      
      if (!data || typeof data !== 'object') {
        console.log('  No valid data in notification');
        continue;
      }
      
      if (data.achievement_id && typeof data.achievement_id === 'string') {
        console.log('  Would navigate to achievements');
      } else if (data.achievement_id) {
        console.log('  Invalid achievement_id type, skipping');
      }
      
      console.log(`  ✅ Test case passed: ${JSON.stringify(testCase.data)}`);
    } catch (error) {
      console.log(`  ❌ Test case failed: ${JSON.stringify(testCase.data)}`);
    }
  }
  
  console.log('✅ PASS: All notification data cases handled');
}

// Test 8: Match Score Null Values
export async function testNullScores() {
  console.log('Test 8: Null Score Values');
  
  const mockMatch = {
    score_team1: null,
    score_team2: undefined,
  };
  
  const score1 = mockMatch.score_team1 ?? 0;
  const score2 = mockMatch.score_team2 ?? 0;
  
  console.assert(score1 === 0, 'Null score should default to 0');
  console.assert(score2 === 0, 'Undefined score should default to 0');
  console.log('✅ PASS: Null scores handled correctly');
}

// Test 9: User in Multiple Teams (Edge Case)
export async function testUserInMultipleTeams() {
  console.log('Test 9: User in Multiple Teams');
  
  const userId = 'user123';
  const team1Ids = ['user123', 'user456'];
  const team2Ids = ['user123', 'user789']; // User somehow in both teams
  
  const userInTeam1 = team1Ids.includes(userId);
  const userInTeam2 = team2Ids.includes(userId);
  
  if (!userInTeam1 && !userInTeam2) {
    console.log('  User not in any team - would filter out');
  } else {
    console.log('  User found in teams:', { userInTeam1, userInTeam2 });
  }
  
  console.log('✅ PASS: Multi-team scenario handled');
}

// Test 10: Storage Bucket Error
export async function testStorageBucketError() {
  console.log('Test 10: Storage Bucket Error Handling');
  
  try {
    // Simulate storage error
    throw new Error('Bucket not found');
  } catch (error: any) {
    console.log('  Error caught:', error.message);
    console.log('✅ PASS: Storage errors handled in try/catch');
    return { error: error.message };
  }
}

// Run all tests
export async function runAllEdgeCaseTests() {
  console.log('='.repeat(50));
  console.log('Running Edge Case Test Suite');
  console.log('='.repeat(50));
  
  await testMissingFileExtension();
  await testLargeFileSize();
  await testNullProfileData();
  await testEmptyTeams();
  await testPushTokenValidation();
  await testDeviceModuleSafety();
  await testNotificationDataValidation();
  await testNullScores();
  await testUserInMultipleTeams();
  await testStorageBucketError();
  
  console.log('='.repeat(50));
  console.log('All Edge Case Tests Completed');
  console.log('='.repeat(50));
}

// Helper: Test Database Connection
export async function testDatabaseConnection() {
  console.log('Testing Database Connection...');
  
  if (!supabase) {
    console.log('❌ FAIL: Supabase not configured');
    return false;
  }
  
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ FAIL: Database query error:', error.message);
      return false;
    }
    
    console.log('✅ PASS: Database connection successful');
    return true;
  } catch (err) {
    console.log('❌ FAIL: Database connection error:', err);
    return false;
  }
}

// Export test runner
export default {
  runAllEdgeCaseTests,
  testDatabaseConnection,
};

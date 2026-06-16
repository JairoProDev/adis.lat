/** Feature flags for business profile rollout */
export function isProfileBlocksV2Enabled(): boolean {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PROFILE_BLOCKS_V2 === 'false') {
    return false;
  }
  return true;
}

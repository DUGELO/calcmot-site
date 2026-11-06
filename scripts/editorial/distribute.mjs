/** Commit the state pointer only after delivery; restore our own failed version. */
export async function distribute({ assertCurrent, persistCandidate, deploy, verify, commit, rollback }) {
  await assertCurrent();
  await persistCandidate();
  try {
    await deploy();
    await verify();
  } catch(error) {
    if(rollback) await rollback();
    throw error;
  }
  // A recording failure after valid delivery is reconciled from its immutable tag.
  await commit();
}

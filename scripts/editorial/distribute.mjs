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

/** A receipt may propagate before an existing HTML URL. Both must match. */
export async function verifyDelivery({ receiptMatches, verifyContent, attempts = 24, wait = () => new Promise(resolve => setTimeout(resolve, 5000)) }) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      if (await receiptMatches()) {
        await verifyContent();
        return;
      }
    } catch (error) { lastError = error; }
    if (attempt + 1 < attempts) await wait();
  }
  throw new Error('Distribuição e conteúdo não confirmados dentro do prazo.', { cause: lastError });
}

const express = require('express');
const router = express.Router();
const {
  getAccounts,
  createAccount,
  getJournals,
  createJournal,
  getJournalEntries,
  createJournalEntry,
  getBudgets,
  createBudget,
} = require('../controllers/accountingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Accounts: /api/accounts
router.route('/accounts')
  .get(authenticateToken, getAccounts)
  .post(authenticateToken, createAccount);

// Journals: /api/journals
router.route('/journals')
  .get(authenticateToken, getJournals)
  .post(authenticateToken, createJournal);

// Journal Entries: /api/journal-entries
router.route('/journal-entries')
  .get(authenticateToken, getJournalEntries)
  .post(authenticateToken, createJournalEntry);

// Budgets: /api/budgets & /api/analytic-accounts
router.route('/budgets')
  .get(authenticateToken, getBudgets)
  .post(authenticateToken, createBudget);

router.route('/analytic-accounts')
  .get(authenticateToken, getBudgets)
  .post(authenticateToken, createBudget);

module.exports = router;

const db = require("../models");
const Item = db.items;
const { Op } = require("sequelize");
const mailService = require("../services/mail.service");

// Helper function to clean and normalize text
const normalizeString = (text) => {
  if (!text) return '';
  return text.toLowerCase().replace(/[^\w]/g, '');
};

// Function to get clean, meaningful keywords from text
const getKeywords = (text) => {
  if (!text) return [];
  const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'is', 'it', 'my', 'i', 'lost', 'found', 'item', 'was']);
  return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
};

// The final, calibrated scoring function
const calculateMatchScore = (itemA, itemB) => {
  if (!itemA.category || !itemB.category || normalizeString(itemA.category) !== normalizeString(itemB.category)) {
    return 0;
  }
  let score = 10;
  const titleKeywordsA = getKeywords(itemA.title);
  const titleKeywordsB = getKeywords(itemB.title);
  const commonTitleKeywords = titleKeywordsA.filter(word => titleKeywordsB.includes(word));
  if (commonTitleKeywords.length > 0) {
    score += 20;
  }
  if (itemA.color && itemB.color && normalizeString(itemA.color) === normalizeString(itemB.color)) {
    score += 15;
  }
  if (itemA.brand && itemB.brand && normalizeString(itemA.brand) === normalizeString(itemB.brand)) {
    score += 20;
  }
  if (itemA.item_size && itemB.item_size && normalizeString(itemA.item_size) === normalizeString(itemB.item_size)) {
    score += 10;
  }
  const descKeywordsA = new Set(getKeywords(itemA.description));
  const descKeywordsB = new Set(getKeywords(itemB.description));
  let descMatches = 0;
  for (const keyword of descKeywordsA) {
    if (descKeywordsB.has(keyword)) descMatches++;
  }
  if (descMatches >= 3) {
    score += 30;
  } else if (descMatches > 0) {
    score += 10;
  }
  const marksKeywordsA = new Set(getKeywords(itemA.unique_marks));
  const marksKeywordsB = new Set(getKeywords(itemB.unique_marks));
  let marksMatches = 0;
  for (const keyword of marksKeywordsA) {
    if (marksKeywordsB.has(keyword)) marksMatches++;
  }
  if (marksMatches > 0) {
    score += 20;
  }
  if (itemA.image_url && itemB.image_url && score >= 50) {
    score += 15;
  }
  return score;
};

// The main function that finds matches in both directions
const findPotentialMatches = async (newItem) => {
  if (!newItem.is_verified) return;

  let itemsToCompare;
  let lostItem;
  let foundItem;

  if (newItem.status === 'found') {
    itemsToCompare = await Item.findAll({
      where: { status: 'lost', category: newItem.category, is_verified: true },
      include: [{ model: db.users, as: 'user' }]
    });
    foundItem = newItem;
  } else if (newItem.status === 'lost') {
    // We need to get the details of the new lost item, including its user
    const newLostItemDetails = await Item.findByPk(newItem.id, { include: [{ model: db.users, as: 'user' }] });
    if (!newLostItemDetails) return;
    
    itemsToCompare = await Item.findAll({
      where: { status: 'found', category: newItem.category, is_verified: true },
      include: [{ model: db.users, as: 'user' }]
    });
    lostItem = newLostItemDetails;
  } else {
    return;
  }

  console.log(`Comparing new '${newItem.status}' item against ${itemsToCompare.length} items.`);

  for (const existingItem of itemsToCompare) {
    if (newItem.status === 'found') {
      lostItem = existingItem;
    } else {
      foundItem = existingItem;
    }
    
    const score = calculateMatchScore(foundItem, lostItem);
    const ownerOfLostItem = lostItem.user;

    console.log(`Comparing with item #${existingItem.id}. Score: ${score}`);

    // --- THIS IS THE CORRECTED LOGIC ---
    if (score >= 50 && ownerOfLostItem && ownerOfLostItem.email) {
      console.log(`!!! High-scoring match found! Item #${foundItem.id} matches lost item #${lostItem.id} with score ${score}.`);
      mailService.sendMatchNotificationEmail(ownerOfLostItem.email, foundItem);
    }
    // ------------------------------------
  }
};

module.exports = { findPotentialMatches };

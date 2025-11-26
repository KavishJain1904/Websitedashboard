const mongoose = require('mongoose');

const PageContentSchema = new mongoose.Schema({
  sectionId: { type: String, required: true, unique: true },
  html: { type: String, required: true },
  updatedBy: { type: String },   
}, { timestamps: true });

module.exports = mongoose.model('PageContent', PageContentSchema);

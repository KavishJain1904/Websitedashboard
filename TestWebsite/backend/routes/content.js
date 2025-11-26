// routes/content.js
const express = require('express');
const PageContent = require('../models/pageContent'); // pageContent.js model
const verifyToken = require('../middleware/verify');

const router = express.Router();

/**
 * Default content used to seed the database
 * and also as fallback when nothing exists yet.
 */
const defaultContent = {
  dashboard: `<div class="hero">
    <h1>Welcome to Your Dashboard</h1>
    <p>Access all your tools and manage your projects from here</p>
</div>
<div class="services-grid">
    <div class="service-card">
        <div class="service-icon">📊</div>
        <h3>Analytics</h3>
        <p>View your website performance and user engagement metrics</p>
    </div>
    <div class="service-card">
        <div class="service-icon">⚙️</div>
        <h3>Settings</h3>
        <p>Manage your account settings and preferences</p>
    </div>
    <div class="service-card">
        <div class="service-icon">📁</div>
        <h3>Projects</h3>
        <p>Access and manage all your active projects</p>
    </div>
</div>`,

  about: `<h2>About TechVision Solutions</h2>
<p>Founded in 2020, TechVision Solutions is a leading technology company specializing in cutting-edge digital solutions. We help businesses transform their operations through innovative technology implementations.</p>

<h3>Our Mission</h3>
<p>To empower businesses with technology solutions that drive growth, efficiency, and innovation. We believe in creating digital experiences that not only meet current needs but anticipate future challenges.</p>

<h3>Our Values</h3>
<p><strong>Innovation:</strong> We stay at the forefront of technological advancement</p>
<p><strong>Quality:</strong> We deliver excellence in every project</p>
<p><strong>Integrity:</strong> We build trust through transparent communication</p>
<p><strong>Collaboration:</strong> We work closely with our clients as partners</p>`,

  services: `<h2>Our Services</h2>
<p>We offer comprehensive technology solutions tailored to your business needs.</p>

<div class="services-grid">
    <div class="service-card">
        <div class="service-icon">🌐</div>
        <h3>Web Development</h3>
        <p>Full-stack web development using React, Node.js, Python, and modern frameworks.</p>
    </div>
    <div class="service-card">
        <div class="service-icon">📱</div>
        <h3>Mobile Development</h3>
        <p>Native iOS and Android apps, as well as cross-platform solutions.</p>
    </div>
    <div class="service-card">
        <div class="service-icon">☁️</div>
        <h3>Cloud Solutions</h3>
        <p>AWS, Azure, and Google Cloud implementations and migration services.</p>
    </div>
    <div class="service-card">
        <div class="service-icon">🎨</div>
        <h3>UI/UX Design</h3>
        <p>User-centered design solutions that create engaging digital experiences.</p>
    </div>
</div>`,

  portfolio: `<h2>Our Portfolio</h2>
<p>Explore some of our recent projects and success stories.</p>

<div class="services-grid">
    <div class="service-card">
        <div class="service-icon">🏪</div>
        <h3>E-commerce Platform</h3>
        <p>Built a scalable e-commerce solution handling 10,000+ daily transactions.</p>
    </div>
    <div class="service-card">
        <div class="service-icon">🏥</div>
        <h3>Healthcare System</h3>
        <p>Developed a comprehensive patient management system for medical clinics.</p>
    </div>
    <div class="service-card">
        <div class="service-icon">🎓</div>
        <h3>Education Platform</h3>
        <p>Created an interactive learning management system for global students.</p>
    </div>
</div>`,

  contact: `<h2>Get In Touch</h2>
<p>Ready to start your next project? Contact us today for a consultation.</p>

<div class="contact-form">
    <form id="contactForm">
        <div class="form-group">
            <label for="contactName">Full Name</label>
            <input type="text" id="contactName" name="name" required placeholder="Enter your full name">
        </div>

        <div class="form-group">
            <label for="contactEmail">Email Address</label>
            <input type="email" id="contactEmail" name="email" required placeholder="Enter your email">
        </div>

        <div class="form-group">
            <label for="contactMessage">Message</label>
            <textarea id="contactMessage" name="message" rows="5" required placeholder="Tell us about your project."></textarea>
        </div>

        <button type="submit" class="cta-button">Send Message</button>
    </form>
</div>`,

  blog: `<h2>Latest Blog Posts</h2>
<p>Stay updated with the latest technology trends and insights.</p>

<div class="services-grid">
    <div class="service-card">
        <h3>The Future of Web Development</h3>
        <p>Exploring emerging technologies and trends shaping web development in 2024.</p>
        <p><small>Posted on March 15, 2024</small></p>
    </div>
    <div class="service-card">
        <h3>Cloud Migration Best Practices</h3>
        <p>A comprehensive guide to successfully migrating applications to the cloud.</p>
        <p><small>Posted on March 10, 2024</small></p>
    </div>
    <div class="service-card">
        <h3>Mobile App Security Tips</h3>
        <p>Essential security measures every mobile app developer should implement.</p>
        <p><small>Posted on March 5, 2024</small></p>
    </div>
</div>`,

  adminPanel: `<h2>Admin Control Panel</h2>
<p>Welcome, Admin! You have full access to manage website content.</p>
<p>You can edit all page content by using the <strong>Content Editor</strong> from the navigation bar.</p>
<p>
    <a href="admin-editor.html">🛠️ Open Content Editor</a>
</p>`
};

/**
 * Middleware: require a valid JWT AND admin user.
 */
function requireAdmin(req, res, next) {
  // reuse existing verifyToken middleware
  verifyToken(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}

/**
 * Helper: find existing section in DB or create
 * it with default content.
 */
async function getOrCreateSection(sectionId) {
  let doc = await PageContent.findOne({ sectionId });

  if (!doc) {
    const html = defaultContent[sectionId] || '';
    doc = await PageContent.create({
      sectionId,
      html,
      updatedBy: 'system'
    });
  }

  return doc;
}

// PUBLIC: get content for a single section (used by main website)
router.get('/content/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const doc = await getOrCreateSection(sectionId);
    res.json({
      success: true,
      sectionId: doc.sectionId,
      html: doc.html
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content'
    });
  }
});

// ADMIN: update content for a section
router.put('/content/:sectionId', requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { html } = req.body;

    // allow empty string but not undefined/null
    if (html === undefined) {
      return res.status(400).json({
        success: false,
        message: 'HTML content is required'
      });
    }

    const updatedBy =
      req.user?.id ||
      req.user?.email ||
      'admin';

    const doc = await PageContent.findOneAndUpdate(
      { sectionId },
      { html, updatedBy },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Content updated successfully for ${sectionId}`,
      sectionId: doc.sectionId,
      html: doc.html
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content'
    });
  }
});

// ADMIN: get all sections (for future admin UI if needed)
router.get('/content', requireAdmin, async (req, res) => {
  try {
    const docs = await PageContent.find().sort('sectionId');
    res.json({
      success: true,
      content: docs
    });
  } catch (error) {
    console.error('Error getting all content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content'
    });
  }
});

module.exports = router;

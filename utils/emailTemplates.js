/**
 * BIOMEN LABS Email Templates generator (v2 Expert Rewrite)
 * Generates beautiful, responsive HTML templates matching premium brand guidelines.
 */

// Global Layout Wrapper for Premium Branding
const wrapEmailTemplate = (title, bodyContentHtml, ctaText = '', ctaUrl = '') => {
  const baseUrl = process.env.FRONTEND_URL || 'https://biomenlabs.com';
  const unsubscribeLink = `${baseUrl}/unsubscribe`;
  const managePreferencesLink = `${baseUrl}/preferences`;

  const ctaBtn = ctaText && ctaUrl ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${ctaUrl}" target="_blank" style="background-color: #16C784; color: #030705; font-family: 'Outfit', 'Helvetica Neue', sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 8px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(22, 199, 132, 0.2); transition: all 0.2s ease;">
        ${ctaText}
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&family=Inter:wght@400;500&display=swap');
        body {
          margin: 0;
          padding: 0;
          background-color: #030705;
          color: #F4F6F2;
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #030705;
          border: 1px solid #1a251e;
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          padding: 35px 40px 10px 40px;
          text-align: left;
        }
        .logo {
          color: #16C784;
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .logo-sub {
          color: #BFA46A;
          font-size: 9px;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .content {
          padding: 20px 40px 30px 40px;
          font-size: 15px;
          line-height: 1.65;
          color: #E2E8F0;
        }
        .content p {
          margin: 0 0 20px 0;
        }
        .signature {
          margin-top: 35px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 20px;
          color: #A8B3AA;
        }
        .founder-names {
          color: #F4F6F2;
          font-weight: bold;
          font-family: 'Outfit', sans-serif;
        }
        .footer {
          background-color: #010402;
          padding: 30px 40px;
          text-align: center;
          font-size: 11px;
          color: #64748B;
          border-top: 1px solid #1a251e;
        }
        .footer a {
          color: #16C784;
          text-decoration: none;
        }
        .highlight-box {
          background-color: #061009;
          border-left: 3px solid #16C784;
          padding: 16px 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .highlight-title {
          font-family: 'Outfit', sans-serif;
          color: #BFA46A;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 13px;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .bullet-list {
          margin: 0 0 25px 0;
          padding-left: 20px;
        }
        .bullet-list li {
          margin-bottom: 12px;
          color: #E2E8F0;
        }
        .gold-text {
          color: #BFA46A;
        }
      </style>
    </head>
    <body>
      <div style="background-color: #030705; padding: 20px 0;">
        <div class="container">
          <div class="header">
            <div class="logo">BIOMEN LABS</div>
            <div class="logo-sub">T-CORE VITALITY</div>
          </div>
          <div class="content">
            ${bodyContentHtml}
            ${ctaBtn}
            <div class="signature">
              Nikhil & Ayushman<br/>
              <span class="founder-names">BIOMEN LABS</span>
            </div>
          </div>
          <div class="footer">
            🔒 Safe & Secure. This email was sent to you because you opted in at our website.<br/>
            Biomen Labs Premium Vitality, India. <br/>
            <a href="${unsubscribeLink}">Unsubscribe</a> | <a href="${managePreferencesLink}">Manage Preferences</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Define Email Template Registry
const templates = {
  // ==========================================
  // FLOW 1: WELCOME / LEAD NURTURE
  // ==========================================
  Welcome: {
    1: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Welcome to BIOMEN LABS.</p>
        <p>Before you look around, here is the simple truth behind this brand: we did not want to create another loud supplement company. We wanted to build the kind of men's wellness product we wished existed in India - transparent, premium, disciplined and easy to understand.</p>
        <p>T-CORE is our first product. It is a daily male vitality formula built around five selected herbal extracts: Shilajit, Fenugreek, Tongkat Ali, Ashwagandha and Black Pepper Extract.</p>
        <p>No proprietary blend. No hidden doses. No 40-ingredient label designed to look impressive but say very little.</p>
        <p>Our belief is simple: men do not need more hype. They need better routines, better standards and products that are clear about what is inside.</p>
        <p>Start with T-CORE here:</p>
      `;
      return {
        subject: 'Welcome to BIOMEN LABS - read this first',
        html: wrapEmailTemplate('Welcome to BIOMEN LABS', body, 'Explore T-CORE', product_link)
      };
    },
    2: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>A serious supplement should be easy to understand.</p>
        <p>Here is the daily serving of T-CORE:</p>
        <ul class="bullet-list">
          <li><strong class="gold-text">Shilajit Extract</strong> - 500 mg, chosen for vitality, stamina and energy support.</li>
          <li><strong class="gold-text">Fenugreek Extract</strong> - 490 mg, chosen for male wellness, strength and vitality support.</li>
          <li><strong class="gold-text">Tongkat Ali Extract</strong> - 300 mg, chosen for masculine vitality and performance-support positioning.</li>
          <li><strong class="gold-text">Ashwagandha Extract</strong> - 300 mg, chosen for stress resilience, recovery and adaptogenic support.</li>
          <li><strong class="gold-text">Black Pepper Extract / Piperine</strong> - 10 mg, chosen to support absorption and formula efficiency.</li>
        </ul>
        <p>That is 1,600 mg of active herbal ingredients per daily serving. Two capsules. Once daily after a meal.</p>
        <p>We built T-CORE this way because the modern Indian man is dealing with stress, inconsistent routines, poor recovery and energy dips. T-CORE is not a shortcut. It is a daily support system for men who are building better foundations.</p>
        <p>See the full formula here:</p>
      `;
      return {
        subject: '5 ingredients. No hidden doses.',
        html: wrapEmailTemplate('5 ingredients. No hidden doses.', body, 'See Full Formula', product_link)
      };
    },
    3: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Here is something we want to say before you buy T-CORE.</p>
        <p>Do not judge a daily herbal formula like a pre-workout. T-CORE is not designed to hit you in 20 minutes. It is built to become part of your routine.</p>
        <p>The men who get the most out of products like this usually do three things well:</p>
        <ol class="bullet-list" style="list-style-type: decimal;">
          <li>They take it consistently.</li>
          <li>They take it with food.</li>
          <li>They give their body enough time to respond.</li>
        </ol>
        <p>That is why every bottle is a 30-day supply. The first bottle gives you a real read. The second and third month are where consistency becomes a lifestyle.</p>
        <div class="highlight-box">
          <div class="highlight-title">The Foundation Protocol</div>
          T-CORE supports vitality, energy, stamina, strength and male wellness - but your basics still matter: food, training, sleep, hydration and discipline. That is the honest way to use it.
        </div>
      `;
      return {
        subject: 'A 30-day formula needs a 30-day mindset',
        html: wrapEmailTemplate('30-Day Mindset', body, 'Explore T-CORE', product_link)
      };
    },
    4: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>This is the last email in this welcome series.</p>
        <p>Here is the simple case for T-CORE:</p>
        <ul class="bullet-list">
          <li>A full 30-day supply.</li>
          <li>Five selected herbal extracts.</li>
          <li>1,600 mg active ingredients per daily serving.</li>
          <li>No proprietary blend.</li>
          <li>A premium Ayurvedic male vitality formula built by founders whose names are attached to the product.</li>
          <li>Price: INR 1,499 - roughly INR 50 per day.</li>
        </ul>
        <p>If you are looking for an instant miracle, T-CORE is not the right product.</p>
        <p>If you are looking for a clean daily system to support vitality, stamina, energy, recovery and male wellness, this is exactly what we built it for.</p>
      `;
      return {
        subject: 'Still thinking about T-CORE?',
        html: wrapEmailTemplate('Still thinking about T-CORE?', body, 'Try T-CORE', product_link)
      };
    }
  },

  // ==========================================
  // FLOW 2: BROWSE ABANDONMENT
  // ==========================================
  'Browse Abandonment': {
    1: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>You were looking at T-CORE earlier, so here is the short version.</p>
        <p>T-CORE is a daily male vitality formula for men who want to support energy, stamina, recovery, strength and overall male wellness - without loud, overhyped supplement branding.</p>
        <div class="highlight-box">
          <div class="highlight-title">Daily serving details</div>
          Shilajit 500 mg + Fenugreek 490 mg + Tongkat Ali 300 mg + Ashwagandha 300 mg + Black Pepper Extract 10 mg.<br/>
          <strong>60 vegetarian capsules. 30-day supply. 2 capsules daily after meals.</strong>
        </div>
      `;
      return {
        subject: 'Still looking at T-CORE?',
        html: wrapEmailTemplate('Still looking at T-CORE?', body, 'Take Another Look', product_link)
      };
    },
    2: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>A lot of supplements try to impress you with huge ingredient lists.</p>
        <p>We went the other way. T-CORE uses five ingredients because every ingredient needs a job.</p>
        <p>Shilajit supports vitality and stamina. Fenugreek supports male strength and vitality. Tongkat Ali gives the formula its modern masculine performance edge. Ashwagandha supports stress resilience and recovery. Black Pepper Extract supports absorption.</p>
        <p>That is the system. Not more ingredients for the sake of looking complicated. Not a proprietary blend. Not a formula that hides behind small quantities. Just a focused daily male vitality formula.</p>
      `;
      return {
        subject: 'Why T-CORE has 5 ingredients, not 25',
        html: wrapEmailTemplate('Focused Formulation', body, 'See T-CORE', product_link)
      };
    },
    3: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Before you decide whether T-CORE is for you, read this kind of feedback we are looking for from early customers:</p>
        <ul class="bullet-list">
          <li>Did they use it consistently for 30 days?</li>
          <li>Did they follow the dosage properly?</li>
          <li>Did they notice support in energy, stamina, recovery, training consistency or general vitality?</li>
          <li>Would they reorder for month 2?</li>
        </ul>
        <p>We do not want fake hype. We want real customer experiences from men who used the bottle properly.</p>
        <p>As BIOMEN grows, this email will be updated with verified reviews from actual customers. Until then, the promise stays simple: full formula transparency, founder accountability and a product built for long-term male wellness routines.</p>
      `;
      return {
        subject: 'What early customers are saying',
        html: wrapEmailTemplate('Customer Experiences', body, 'Take Another Look', product_link)
      };
    }
  },

  // ==========================================
  // FLOW 3: CART + CHECKOUT RECOVERY
  // ==========================================
  'Cart Recovery': {
    1: (firstName, { cart_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>You added T-CORE to your cart but did not complete the order.</p>
        <div class="highlight-box" style="text-align: center;">
          <strong>T-CORE - 60 vegetarian capsules - 30-day supply - INR 1,499</strong>
        </div>
        <p>Your cart is saved. If checkout did not work properly or COD/prepaid options were confusing, reply to this email and we will help you.</p>
      `;
      return {
        subject: 'You left T-CORE in your cart',
        html: wrapEmailTemplate('Your cart is saved', body, 'Complete My Order', cart_link)
      };
    },
    2: (firstName, { cart_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>You were close to ordering T-CORE. If you paused, it is probably for one of these reasons.</p>
        <p><strong>"Can I trust a new brand?"</strong><br/>
        Fair question. BIOMEN LABS is founder-led. Our names are attached to the product, and we are building in public with full formula transparency.</p>
        <p><strong>"Is INR 1,499 worth it?"</strong><br/>
        That is about INR 50 per day for a 30-day male vitality formula with 1,600 mg of active herbal ingredients per daily serving. We would rather explain the value clearly than hide behind fake discounts.</p>
        <p><strong>"Will I feel it immediately?"</strong><br/>
        T-CORE is not a stimulant. Use it consistently as directed and evaluate it over a proper 30-day routine.</p>
        <p><strong>"What if I have a question?"</strong><br/>
        Reply here. We respond.</p>
      `;
      return {
        subject: 'The common doubts before buying T-CORE',
        html: wrapEmailTemplate('Doubts Handled', body, 'Complete Order', cart_link)
      };
    },
    3: (firstName, { cart_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Sometimes the reason someone does not complete checkout is not the product. It is the process.</p>
        <p>Quick answers:</p>
        <ul class="bullet-list">
          <li><strong>COD / Prepaid:</strong> Choose the option shown at checkout.</li>
          <li><strong>Delivery:</strong> Tracking details are shared immediately after dispatch.</li>
          <li><strong>Dosage:</strong> 2 capsules daily after a meal.</li>
          <li><strong>Pack size:</strong> 60 vegetarian capsules, 30-day supply.</li>
          <li><strong>Support:</strong> Reply to this email if anything looks wrong.</li>
        </ul>
      `;
      return {
        subject: 'Need help finishing checkout?',
        html: wrapEmailTemplate('Checkout Reassurance', body, 'Return To Checkout', cart_link)
      };
    },
    4: (firstName, { cart_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Final note about your T-CORE cart.</p>
        <p>Complete your order today and we will prioritise your dispatch from our side. No discount code, no gimmick - just a small gesture for someone who was already considering it.</p>
        <div class="highlight-box" style="text-align: center;">
          <strong>T-CORE - INR 1,499 - 60 vegetarian capsules - 30-day supply</strong>
        </div>
        <p>If this is not the right time, no hard feelings. We will not keep chasing this cart.</p>
      `;
      return {
        subject: 'One final nudge on your T-CORE cart',
        html: wrapEmailTemplate('Priority Dispatch Nudge', body, 'Complete Order', cart_link)
      };
    }
  },

  // ==========================================
  // FLOW 4: POST-PURCHASE ONBOARDING
  // ==========================================
  'Post-Purchase': {
    1: (firstName, { order_id, tracking_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Your T-CORE order is confirmed.</p>
        <div class="highlight-box">
          <strong>Order:</strong> #${order_id}<br/>
          <strong>Product:</strong> T-CORE - 60 vegetarian capsules - 30-day supply
        </div>
        <p>You will receive dispatch and tracking details once your order is prepared.</p>
        <p>A quick note from us: thank you for trusting a new brand. We know that trust has to be earned, not demanded. When your bottle arrives, follow the dosage exactly as printed on the label. T-CORE is built for consistency, not overnight hype.</p>
        <p>If anything looks wrong with your order, reply to this email and we will help you.</p>
      `;
      return {
        subject: 'Order confirmed - and a quick note',
        html: wrapEmailTemplate('Order Confirmed', body, 'Track My Order', tracking_link || '#')
      };
    },
    2: (firstName, { guide_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Before you start T-CORE, keep the protocol simple.</p>
        <p><strong>How to take it:</strong></p>
        <ul class="bullet-list">
          <li>2 capsules daily.</li>
          <li>Take after a meal.</li>
          <li>Take at roughly the same time every day.</li>
          <li>Do not exceed the recommended dosage.</li>
          <li>If you are under medication, speak to a physician before use.</li>
        </ul>
        <p><strong>What to expect:</strong></p>
        <ul class="bullet-list">
          <li><strong class="gold-text">Week 1:</strong> Routine. Do not look for dramatic changes.</li>
          <li><strong class="gold-text">Week 2-3:</strong> Consistent users begin to understand how the product fits their rhythm.</li>
          <li><strong class="gold-text">Week 4:</strong> Fair first read.</li>
        </ul>
        <p>T-CORE supports male vitality, stamina, energy, strength and wellness. It works best when your basics are strong: sleep, hydration, food and movement.</p>
      `;
      return {
        subject: 'How to use T-CORE properly',
        html: wrapEmailTemplate('Usage Protocol', body, 'Read Ingredient Guide', guide_link || '#')
      };
    },
    3: (firstName, { formula_details_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>By now, T-CORE should be part of your daily routine.</p>
        <p>Here is why the formula is built the way it is:</p>
        <ul class="bullet-list">
          <li><strong>Shilajit</strong> supports vitality and stamina.</li>
          <li><strong>Fenugreek</strong> supports male strength and vitality.</li>
          <li><strong>Tongkat Ali</strong> gives the formula its modern masculine wellness edge.</li>
          <li><strong>Ashwagandha</strong> supports stress resilience and recovery.</li>
          <li><strong>Black Pepper Extract</strong> supports absorption.</li>
        </ul>
        <p>The point is not to overload your body with a long list of fashionable ingredients. The point is to create a focused daily system that is easy to use consistently. That is why we kept T-CORE transparent. You should know what you are taking.</p>
      `;
      return {
        subject: 'Why we chose these 5 ingredients',
        html: wrapEmailTemplate('Ingredient Confidence', body, 'View Formula Details', formula_details_link || '#')
      };
    },
    4: (firstName, { support_email }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>You are around two weeks into your T-CORE routine. Quick check-in: how is it going?</p>
        <ul class="bullet-list">
          <li>Are you taking 2 capsules daily after a meal?</li>
          <li>Have you missed many days?</li>
          <li>Any discomfort, confusion or questions?</li>
        </ul>
        <p>Reply with one word if that is easiest:</p>
        <p><strong>GOOD</strong> - everything is fine.<br/>
        <strong>QUESTION</strong> - you need help using it properly.<br/>
        <strong>ISSUE</strong> - something is not right.</p>
        <p>We would rather help you privately and quickly than let confusion turn into a bad experience.</p>
      `;
      return {
        subject: 'Two weeks in - quick check-in',
        html: wrapEmailTemplate('Two-Week Check-in', body, 'Reply To This Email', `mailto:${support_email || 'support@biomenlabs.com'}`)
      };
    },
    5: (firstName, { review_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>You are now deep enough into your first T-CORE bottle to have a real opinion.</p>
        <p>We would genuinely appreciate your honest review. If the product has been useful for your routine, your review helps the next man make a better decision. If something has not been right, reply to this email first and we will understand what happened.</p>
        <p>Please keep it real. Specific, honest feedback is more valuable to us than exaggerated praise.</p>
      `;
      return {
        subject: '3 weeks in - can we ask for your honest review?',
        html: wrapEmailTemplate('Honest Review Request', body, 'Leave A Review', review_link || '#')
      };
    }
  },

  // ==========================================
  // FLOW 5: REORDER + CONTINUITY
  // ==========================================
  Reorder: {
    1: (firstName, { reorder_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>You are likely entering the final week of your first T-CORE bottle.</p>
        <p>This is the moment where most people make one of two choices: They either continue the routine and give their body a proper longer window, or they stop, get busy and lose momentum.</p>
        <p>If T-CORE has been fitting well into your routine, reorder before the gap starts to keep your progress going.</p>
      `;
      return {
        subject: 'Your T-CORE bottle is nearing the final week',
        html: wrapEmailTemplate('Continuity Reminder', body, 'Reorder T-CORE', reorder_link || '#')
      };
    },
    2: (firstName, { reorder_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>If you have taken T-CORE consistently, you are near the end of your first 30 days.</p>
        <p>Month 1 gives you the first read. Month 2 helps you understand whether this should become part of your regular routine. That is why we recommend avoiding a gap.</p>
        <div class="highlight-box" style="text-align: center;">
          <strong>T-CORE - INR 1,499 - 30-day supply</strong>
        </div>
        <p>If you have questions before reordering, reply here.</p>
      `;
      return {
        subject: 'Month 1 builds the base. Month 2 keeps it moving.',
        html: wrapEmailTemplate('Month 2 Baseline', body, 'Reorder Now', reorder_link || '#')
      };
    },
    3: (firstName, { bundle_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>A single bottle is a trial. A 90-day supply is a routine.</p>
        <p>That is why the 90-day T-CORE bundle exists. It reduces gaps, saves you the reorder effort and keeps the protocol simple.</p>
        <p>Best for you if:</p>
        <ul class="bullet-list">
          <li>You used the first bottle consistently.</li>
          <li>You want to give T-CORE a fair longer window.</li>
          <li>You dislike running out and reordering last minute.</li>
        </ul>
      `;
      return {
        subject: 'A better way to stay consistent',
        html: wrapEmailTemplate('90-Day Bundle Plan', body, 'View 90-Day Bundle', bundle_link || '/products/t-core')
      };
    },
    4: (firstName, { feedback_email }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>We noticed you have not reordered T-CORE. No pressure - but your feedback would help us a lot.</p>
        <p>What was the main reason?</p>
        <p>
          <strong>A</strong> - I forgot / got busy.<br/>
          <strong>B</strong> - Price felt high.<br/>
          <strong>C</strong> - I did not use it consistently.<br/>
          <strong>D</strong> - I did not feel enough difference.<br/>
          <strong>E</strong> - Something else.
        </p>
        <p>Reply with the letter. That is enough. We are building BIOMEN seriously, and feedback from real customers is more valuable than guesses.</p>
      `;
      return {
        subject: 'Can we ask why you did not reorder?',
        html: wrapEmailTemplate('We appreciate feedback', body, 'Reply With A Letter', `mailto:${feedback_email || 'support@biomenlabs.com'}`)
      };
    }
  },

  // ==========================================
  // FLOW 6: REVIEW + REFERRAL LOOP
  // ==========================================
  Review: {
    1: (firstName, { instagram_handle }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Thank you for leaving a review.</p>
        <p>For a new brand, real feedback matters more than almost anything else. It helps the next person decide with more confidence, and it helps us understand what to improve.</p>
        <p>If you are comfortable, you can also share your experience on Instagram and tag us at <strong class="gold-text">${instagram_handle || '@biomenlabs'}</strong>. No pressure - only if it feels natural.</p>
        <p>Thank you for being part of the early BIOMEN community.</p>
      `;
      return {
        subject: 'Thank you for your honest review',
        html: wrapEmailTemplate('Thank You', body, 'Follow BIOMEN On Instagram', `https://instagram.com/${(instagram_handle || 'biomenlabs').replace('@', '')}`)
      };
    },
    2: (firstName, { referral_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Small ask.</p>
        <p>If T-CORE has been useful for your routine, think of one man who might appreciate the same kind of daily support - someone focused on work, training, energy, recovery or simply getting his basics back in order.</p>
        <p>Forward this email to him or share this link:</p>
      `;
      return {
        subject: 'Know one man who should try T-CORE?',
        html: wrapEmailTemplate('Simple Referral Ask', body, 'Share T-CORE', referral_link || '#')
      };
    }
  },

  // ==========================================
  // FLOW 7: WINBACK / CHURN PREVENTION
  // ==========================================
  Winback: {
    1: (firstName, { feedback_email }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>It has been a while since your last T-CORE order.</p>
        <p>No pitch in this email. Just a genuine check-in.</p>
        <p>Did T-CORE fit your routine? Did you stop because of price, results, consistency, delivery experience or something else?</p>
        <p>Reply with one word if that is easier:</p>
        <p><strong>PRICE</strong><br/>
        <strong>RESULTS</strong><br/>
        <strong>FORGOT</strong><br/>
        <strong>DELIVERY</strong><br/>
        <strong>OTHER</strong></p>
        <p>We read these replies because they tell us what to improve.</p>
      `;
      return {
        subject: `Checking in, ${firstName}`,
        html: wrapEmailTemplate('Genuine Check-in', body, 'Reply With Feedback', `mailto:${feedback_email || 'support@biomenlabs.com'}`)
      };
    },
    2: (firstName, { product_link, discounted_price }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>Since you have tried T-CORE before, here is a returning customer offer if you want to restart the routine.</p>
        <div class="highlight-box" style="text-align: center; font-size: 16px;">
          Use code <strong>RETURN15</strong> for <strong>15% OFF</strong> your next bottle.
        </div>
        <p>This brings T-CORE to <strong class="gold-text">INR ${discounted_price || '1,274'}</strong> for your next order.</p>
        <p>Code valid for 7 days. If price was not the reason you stopped, reply and tell us what was.</p>
      `;
      return {
        subject: 'A returning customer offer for you',
        html: wrapEmailTemplate('Restart T-CORE Routine', body, 'Use RETURN15', product_link)
      };
    },
    3: (firstName, { product_link }) => {
      const body = `
        <p>Hey ${firstName},</p>
        <p>This is the last winback email from us for now.</p>
        <p>Your <strong class="gold-text">RETURN15</strong> code expires tonight. If you want to restart T-CORE, here is the link:</p>
        <p>If now is not the right time, that is completely fine. We will step back instead of cluttering your inbox. Thank you for trying T-CORE once. If you decide to come back later, we will be here.</p>
      `;
      return {
        subject: 'Last email from us for now',
        html: wrapEmailTemplate('Graceful Goodbye', body, 'Use RETURN15 Before It Expires', product_link)
      };
    }
  }
};

module.exports = {
  wrapEmailTemplate,
  templates
};

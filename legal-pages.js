const LEGAL_TRANSLATIONS = {
  datenschutz: {
    title: "Privacy Policy",
    description: "Privacy Policy for PointerScore.",
    sections: [
      ["1. Controller", "Emilian Pohle\nAllensteiner Straße 1\n38642 Goslar\nGermany\n\nEmail: pointerscore@outlook.com\nWebsite: https://pointerscore.com"],
      ["2. Provision of the website", "When this website is accessed, technically necessary access data may be processed. This can include IP address, time of access, requested file, referrer, browser type and operating system. Processing is carried out to provide the website securely and reliably."],
      ["3. Registration and login with Supabase", "Supabase Auth is used for registration, login, session management, logout and password reset. The provider is Supabase, Inc., USA. In particular, email address, encrypted password, user ID, authentication and session data, login times and technically necessary connection data may be processed."],
      ["4. Email confirmation and password reset", "Automated emails may be sent to the email address provided for account confirmation and password reset. The links in these emails are used only to confirm or restore the account."],
      ["5. Local storage of session and language", "Supabase stores technically necessary authentication and session tokens in the browser's local storage so that login sessions can remain active and be securely refreshed. The selected language is also stored locally. This storage is necessary for the functions requested by the user."],
      ["6. Calculator and analysis data", "Company metrics entered in the PointerScore calculator may be processed in the browser and, where cloud saving is used, stored in Supabase and linked to the logged-in user account. Access is intended to be restricted to the respective user."],
      ["7. Storage period and account deletion", "Account data is stored as long as the user account exists or statutory retention obligations apply. Deletion of an account can be requested by email to pointerscore@outlook.com. Browser session data is removed from the current session when the user logs out."],
      ["8. Contact", "If you contact PointerScore by email, the information provided will be processed to handle the request."],
      ["9. Google Fonts", "This website may load fonts from Google Fonts. In that case, a connection to Google servers may be established and, in particular, the IP address may be processed. Before productive launch, local hosting of fonts should be reviewed."],
      ["10. Rights of data subjects", "Data subjects may have rights to access, rectification, deletion, restriction of processing, data portability and objection under the applicable legal requirements. There may also be a right to lodge a complaint with a data protection supervisory authority."],
      ["11. Last updated", "Last updated: 06.07.2026"]
    ]
  },
  agb: {
    title: "Terms and Conditions",
    description: "Terms and Conditions for PointerScore.",
    sections: [
      ["1. Scope", "These Terms and Conditions apply to the use of pointerscore.com, user registration and the paid PointerScore subscription. The service is intended for adults. These terms apply to consumers and businesses unless a provision expressly states otherwise."],
      ["2. Provider and contracting party", "Provider and contracting party is Emilian Pohle, trading under PointerScore, Allensteiner Straße 1, 38642 Goslar, Germany. Email: pointerscore@outlook.com. PointerScore is currently a business name of the sole proprietorship of Emilian Pohle."],
      ["3. Description of PointerScore", "PointerScore is a digital platform for structured company analysis using its own scoring system. It may provide metrics, scoring rules, inputs, calculations, evaluations and protected account functions. PointerScore is not investment, financial, tax or legal advice."],
      ["4. Subscription scope", "The paid subscription gives users access to the digital functions activated in their account. This may include scoring functions, input and processing of company metrics, score calculations, evaluations, protected account areas and further functions provided by PointerScore. Future functions are not guaranteed and the platform may be developed further."],
      ["5. Registration and user account", "A user account is required for the subscription. Users must provide accurate information, keep login details confidential and protect them from third-party access. Each account is intended for one person only."],
      ["6. Contract conclusion", "The subscription presentation on the website is not a legally binding offer but an invitation to order. A contract is concluded once payment has been processed successfully and access is activated. The final order button should clearly indicate that a paid order is being placed."],
      ["7. Prices and payment", "The price shown during the order process applies. The current price is €7.99 per month. Payment is made in advance for the relevant billing period. Payments may be processed by an external payment provider."],
      ["8. Term and cancellation", "The PointerScore subscription runs for an indefinite period and can be cancelled monthly. Cancellation takes effect at the end of the already paid billing period. Statutory rights remain unaffected."],
      ["9. Right of withdrawal for consumers", "Consumers generally have a statutory right of withdrawal. Details are set out in the separate withdrawal instructions. The withdrawal period is generally fourteen days."],
      ["10. No investment advice", "PointerScore provides information, education and structured analysis only. It is not investment advice, a recommendation to buy, sell or hold securities, or a substitute for personal responsibility and independent research."],
      ["11. No guarantee of returns or success", "PointerScore does not guarantee profits, returns, price developments, successful investments or specific results. Investments can lead to losses, including total loss."],
      ["12. No guarantee of accuracy, completeness or timeliness", "PointerScore aims to provide a structured method, but does not guarantee that all content, calculations or outputs are accurate, complete or up to date. Users are responsible for checking their own inputs and sources."],
      ["13. User obligations", "Users must use PointerScore lawfully, enter data carefully, not misuse the platform and not interfere with technical systems or access restrictions."],
      ["14. Protection of the PointerScore system", "The PointerScore method, scoring logic, design and platform functions are protected. Copying, reverse engineering, automated scraping or commercial reuse without permission is not permitted."],
      ["15. Copyright, trademarks and rights of use", "All content, designs, texts, graphics, logos, calculations and software components are protected by intellectual property rights. Users receive only a limited, personal right to use the service."],
      ["16. Availability and technical changes", "PointerScore strives for stable availability but cannot guarantee uninterrupted operation. Maintenance, updates, technical problems or external service interruptions may temporarily affect availability."],
      ["17. External services and infrastructure", "PointerScore may use external technical service providers for hosting, authentication, email delivery, payment processing or similar functions. Details on personal data processing are provided in the privacy policy."],
      ["18. Free content and handbook", "Free content such as handbooks may be made available independently of the paid subscription. Such content can be changed or removed."],
      ["19. Beta functions and further development", "New functions may be tested or provided as beta features. They may be incomplete, changed or discontinued."],
      ["20. Account suspension", "PointerScore may restrict or suspend accounts in cases of misuse, security risks, payment default or serious breaches of these terms."],
      ["21. Liability", "PointerScore is liable according to statutory provisions for intent, gross negligence, injury to life, body or health and mandatory legal liability. For simple negligence, liability may be limited to foreseeable typical damages where legally permitted."],
      ["22. Privacy", "Information about the processing of personal data can be found in the privacy policy."],
      ["23. Changes to these terms", "PointerScore may update these terms where necessary, especially for legal, technical or functional changes. Users will be informed appropriately."],
      ["24. Communication", "Communication may take place by email or through notices within the user account or website."],
      ["25. Final provisions", "German law applies where legally permitted. Mandatory consumer protection rules remain unaffected. If individual provisions are invalid, the remaining terms remain effective."]
    ]
  },
  widerruf: {
    title: "Withdrawal Instructions",
    description: "Withdrawal instructions for PointerScore.",
    sections: [
      ["1. Right of withdrawal", "Consumers have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period begins on the day the contract is concluded."],
      ["2. Exercising the right of withdrawal", "To exercise the right of withdrawal, you must inform Emilian Pohle, PointerScore, Allensteiner Straße 1, 38642 Goslar, Germany, email: pointerscore@outlook.com, by a clear statement that you wish to withdraw from the contract."],
      ["3. Consequences of withdrawal", "If you withdraw from the contract, payments received from you must generally be refunded without undue delay and no later than fourteen days from the day on which the withdrawal notice is received, subject to statutory rules and any applicable compensation for services already provided."],
      ["4. Start of service before the end of the withdrawal period", "If you expressly request that the service begins before the withdrawal period has expired, you may owe reasonable compensation for the services already provided up to the time of withdrawal, where legally permitted."],
      ["5. No shipment of goods", "PointerScore provides digital services. No physical goods are shipped."],
      ["6. Notice for businesses", "Business customers do not have a statutory consumer right of withdrawal."],
      ["Checkout notes", "The checkout should clearly display the price, subscription period, cancellation option, legal links and the consequences of starting the service before the withdrawal period ends."]
    ]
  },
  widerrufsformular: {
    title: "Model Withdrawal Form",
    description: "Model withdrawal form for PointerScore.",
    sections: [
      ["Instructions for use", "If you want to withdraw from the contract, you may use this form and send it to us. Use of this form is not mandatory."],
      ["To", "Emilian Pohle, PointerScore, Allensteiner Straße 1, 38642 Goslar, Germany. Email: pointerscore@outlook.com"],
      ["Withdrawal declaration", "I/we hereby withdraw from the contract concluded by me/us for the provision of the PointerScore subscription."],
      ["Ordered on", "________________________________________"],
      ["Name of consumer", "________________________________________"],
      ["Email address of the PointerScore user account", "________________________________________"],
      ["Address of consumer", "________________________________________"],
      ["Date", "________________________________________"],
      ["Signature of consumer - only required for notification on paper", "________________________________________"],
      ["Sending", "You can send the completed form by email to pointerscore@outlook.com or by post to the address above."]
    ]
  },
  haftungsausschluss: {
    title: "Disclaimer",
    description: "Disclaimer for PointerScore.",
    sections: [
      ["1. General notice", "PointerScore is a structured analysis and educational tool. The information and calculations are provided for informational purposes only."],
      ["2. No investment advice", "PointerScore does not provide investment advice, financial advice, tax advice or legal advice."],
      ["3. No buy, sell or hold recommendation", "Scores, categories, reports and explanations are not recommendations to buy, sell or hold securities or other financial instruments."],
      ["4. No guarantee of accuracy, completeness or timeliness", "PointerScore does not guarantee that content, calculations, sources or results are accurate, complete or up to date."],
      ["5. No guarantee of returns or success", "PointerScore does not guarantee investment success, returns, price gains or avoidance of losses."],
      ["6. User responsibility", "Users remain fully responsible for their own research, assumptions, data sources and decisions."],
      ["7. No financial service", "PointerScore is not a licensed financial services provider and does not manage assets or broker investments."],
      ["8. User inputs and own data", "The quality of the results depends heavily on the data entered by the user. Incorrect, outdated or incomplete inputs can lead to misleading results."],
      ["9. External information and sources", "If users rely on external sources such as annual reports or financial websites, they must check those sources themselves."],
      ["10. Technical availability", "PointerScore may be temporarily unavailable due to maintenance, technical problems or external service interruptions."],
      ["11. Liability for damages", "Liability is governed by the statutory rules and the Terms and Conditions. Mandatory liability remains unaffected."],
      ["12. Relationship to Terms and Privacy Policy", "This disclaimer supplements the Terms and Conditions and the Privacy Policy. In case of personal data processing, the Privacy Policy applies."]
    ]
  },
  cookies: {
    title: "Cookie Notice",
    description: "Cookie notice for PointerScore.",
    sections: [
      ["1. General notice", "This notice explains which cookies and local browser storage PointerScore may use."],
      ["2. No tracking or marketing cookies", "PointerScore currently does not intend to use tracking or marketing cookies for advertising profiling."],
      ["3. Technically necessary cookies and storage", "Technically necessary storage may be used for login sessions, security, language selection and functions explicitly requested by the user."],
      ["4. Legal basis", "Technically necessary storage is used to provide requested functions and may be permitted without a separate consent banner under applicable law."],
      ["5. Why no cookie banner is currently used", "If only technically necessary storage is used, a consent banner may not be required. This should be reviewed again before launch if additional tools are added."],
      ["6. Third-party providers and technical infrastructure", "External providers may process technical data when providing hosting, authentication, email or payment functions. Details are provided in the Privacy Policy."],
      ["7. Changes to this cookie notice", "This notice may be updated if the website, technical functions or legal requirements change."]
    ]
  },
  kuendigung: {
    title: "Cancel Subscription",
    description: "Information on cancelling the PointerScore subscription.",
    sections: [
      ["1. Cancelling the PointerScore subscription", "The PointerScore subscription can be cancelled monthly. Cancellation takes effect at the end of the already paid billing period."],
      ["2. Cancellation through the user account", "If an account-based cancellation function is available, users can cancel the subscription directly in their account."],
      ["3. Cancellation through this page", "A dedicated cancellation page may be provided so users can submit a cancellation request clearly and easily."],
      ["4. Cancellation form", "A cancellation form should request only the information necessary to identify the subscription, such as email address and account details."],
      ["5. Cancellation buttons", "Cancellation buttons should be easy to find, clearly labelled and not misleading."],
      ["6. Confirmation page before submitting cancellation", "Before submitting the cancellation, users may be shown a clear confirmation page summarising the cancellation request."],
      ["7. Confirmation after submitting cancellation", "After submission, users should receive a clear confirmation that the cancellation request has been received."],
      ["8. Automatic email confirmation", "Where technically implemented, an automatic email confirmation should be sent after cancellation."],
      ["9. Alternative cancellation by email", "Users can alternatively contact PointerScore by email at pointerscore@outlook.com to request cancellation."]
    ]
  }
};

const originalLegalHtml = new Map();

function getLegalKey() {
  return document.body?.dataset?.legalPage || "";
}

function renderEnglishLegal(key) {
  const data = LEGAL_TRANSLATIONS[key];
  const container = document.querySelector(".legal-document");
  if (!data || !container) return;
  const renderBody = body => String(body).split("\n\n").map(paragraph => `<p>${paragraph.split("\n").join("<br>")}</p>`).join("");
  container.innerHTML = [
    '<p class="eyebrow">Legal</p>',
    `<h1>${data.title}</h1>`,
    '<p class="legal-date">Last updated: 06.07.2026</p>',
    ...data.sections.map(([heading, body], index) => `<section class="legal-section" id="${key}-en-${index + 1}"><h2>${heading}</h2>${renderBody(body)}</section>`)
  ].join("");
  document.title = `${data.title} | PointerScore`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", data.description);
}

function renderGermanLegal(key) {
  const container = document.querySelector(".legal-document");
  if (!container || !originalLegalHtml.has(key)) return;
  container.innerHTML = originalLegalHtml.get(key);
}

function applyLegalLanguage(language = document.documentElement.lang) {
  const key = getLegalKey();
  if (!key || !LEGAL_TRANSLATIONS[key]) return;
  const container = document.querySelector(".legal-document");
  if (container && !originalLegalHtml.has(key)) originalLegalHtml.set(key, container.innerHTML);
  if (language === "en") renderEnglishLegal(key);
  else renderGermanLegal(key);
}

document.addEventListener("DOMContentLoaded", () => applyLegalLanguage(window.PointerScoreI18n?.language || document.documentElement.lang));
window.addEventListener("pointerscore:languagechange", event => applyLegalLanguage(event.detail?.language || document.documentElement.lang));

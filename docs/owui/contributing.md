# https://docs.openwebui.com/contributing

  * [](/)
  * 🤝 Contributing



On this page

# 🤝 Contributing

Sponsored by Open WebUI Inc.

[![Open WebUI Inc.](/sponsors/banners/openwebui-banner.png)![Open WebUI Inc.](/sponsors/banners/openwebui-banner-mobile.png)](https://careers.openwebui.com)

**We are hiring!** Shape the way humanity engages with _intelligence_.

🚀 **Welcome, Contributors!** 🚀

Your interest in contributing to Open WebUI is greatly appreciated. This document is here to guide you through the process, ensuring your contributions enhance the project effectively. Let's make Open WebUI even better, together!

## 💡 Contributing​

Looking to contribute? Great! Here's how you can help:

### 🧪 Test the Development Branch​

**One of the most valuable ways to contribute is running the dev branch.** You don't need to write code—just use it and report issues!
    
    
    docker run -d -p 3000:8080 -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:dev  
    

**Keep it updated regularly** — the dev branch moves fast! If Docker doesn't work for you, the [Local Development Guide](/getting-started/advanced-topics/development) is another great option.

By testing dev builds, you help us catch bugs before stable releases. Report issues on [GitHub](https://github.com/open-webui/open-webui/issues) with clear reproduction steps. **We cannot deliver high-quality releases without community testing.**

### 🌟 Code Contribution Guidelines​

We welcome pull requests. Before submitting one, please:

  1. Open a discussion regarding your ideas [here](https://github.com/open-webui/open-webui/discussions/new/choose).
  2. Follow the project's coding standards and include tests for new features.
  3. Update documentation as necessary.
  4. Write clear, descriptive commit messages.



### 🛠 Code PR Best Practices:​

  1. **Atomic PRs:** Make sure your PRs are small, focused, and deal with a single objective or task. This helps in easier code review and limits the chances of introducing unrelated issues. If the scope of changes grows too large, consider breaking them into smaller, logically independent PRs.
  2. **Follow Existing Code Convention:** Ensure your code aligns with the existing coding standards and practices of the project.
  3. **Avoid Additional External Dependencies:** Do not include additional external dependencies without prior discussion.
  4. **Framework Agnostic Approach:** We aim to stay framework agnostic. Implement functionalities on our own whenever possible rather than relying on external frameworks or libraries. If you have doubts or suggestions regarding this approach, feel free to discuss it.



Thank you for contributing! 🚀

### 📚 Documentation & Tutorials​

Help us make Open WebUI more accessible by improving documentation, writing tutorials, or creating guides on setting up and optimizing the web UI.

### 🌐 Translations and Internationalization​

Help us make Open WebUI available to a wider audience. In this section, we'll guide you through the process of adding new translations to the project.

We use JSON files to store translations. You can find the existing translation files in the `src/lib/i18n/locales` directory. Each directory corresponds to a specific language, for example, `en-US` for English (US), `fr-FR` for French (France) and so on. You can refer to [ISO 639 Language Codes](http://www.lingoes.net/en/translator/langcode.htm) to find the appropriate code for a specific language.

To add a new language:

  * Create a new directory in the `src/lib/i18n/locales` path with the appropriate language code as its name. For instance, if you're adding translations for Spanish (Spain), create a new directory named `es-ES`.
  * Copy the American English translation file(s) (from `en-US` directory in `src/lib/i18n/locale`) to this new directory and update the string values in JSON format according to your language. Make sure to preserve the structure of the JSON object.
  * Add the language code and its respective title to languages file at `src/lib/i18n/locales/languages.json`.



### 🌎 Accessibility Matters​

We are committed to making **Open WebUI** inclusive and usable for everyone. Accessibility is a core part of good system design.

Here’s how you can help improve accessibility when you contribute:

  * **Semantic HTML** : Use semantic HTML elements (`<button>`, `<label>`, `<nav>`, etc.) to ensure screen readers and other assistive technologies can properly interpret the interface.
  * **Keyboard Navigation** : Ensure all interactive elements are fully usable with a keyboard. Avoid mouse-only interactions.
  * **ARIA Labels** : When necessary, use appropriate [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) roles and labels to enhance accessibility, but do not replace semantic html with roles and labels.
  * **Color Contrast & Visual Indicators**: Use high-contrast colors and ensure visual indicators, like focus states, are clear. You can use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify your changes.
  * **Alt Text for Images** : Provide descriptive `alt` text for images and icons when they convey meaning, but equally important, if the image convays no information and is decorative in nature, use an empty alt text (`alt=""`).



To test you changes, you can use tools like lighthouse or the accessibility tools in your browser.

Let's make Open WebUI usable for _everyone_.

### 🤔 Questions & Feedback​

Got questions or feedback? Join our [Discord community](https://discord.gg/5rJgQTnV4s) or open an issue. We're here to help!

### 🚨 Reporting Issues​

Noticed something off? Have an idea? Check our [Issues tab](https://github.com/open-webui/open-webui/issues) to see if it's already been reported or suggested. If not, feel free to open a new issue. When reporting an issue, please follow our issue templates. These templates are designed to ensure that all necessary details are provided from the start, enabling us to address your concerns more efficiently.

important

  * **Template Compliance:** Please be aware that failure to follow the provided issue template, or not providing the requested information at all, will likely result in your issue being closed without further consideration. This approach is critical for maintaining the manageability and integrity of issue tracking.

  * **Detail is Key:** To ensure your issue is understood and can be effectively addressed, it's imperative to include comprehensive details. Descriptions should be clear, including steps to reproduce, expected outcomes, and actual results. Lack of sufficient detail may hinder our ability to resolve your issue.




### 🧭 Scope of Support​

We've noticed an uptick in issues not directly related to Open WebUI but rather to the environment it's run in, especially Docker setups. While we strive to support Docker deployment, understanding Docker fundamentals is crucial for a smooth experience.

  * **Docker Deployment Support** : Open WebUI supports Docker deployment. Familiarity with Docker is assumed. For Docker basics, please refer to the [official Docker documentation](https://docs.docker.com/get-started/overview/).

  * **Advanced Configurations** : Setting up reverse proxies for HTTPS and managing Docker deployments requires foundational knowledge. There are numerous online resources available to learn these skills. Ensuring you have this knowledge will greatly enhance your experience with Open WebUI and similar projects.




## 🙏 Thank You!​

Your contributions, big or small, make a significant impact on Open WebUI. We're excited to see what you bring to the project!

Together, let's create an even more powerful tool for the community. 🌟

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/contributing.mdx)

[Previous🛡️ Security Policy](/security)[Next💖 Sponsorships](/sponsorships)

  * 💡 Contributing
    * 🧪 Test the Development Branch
    * 🌟 Code Contribution Guidelines
    * 🛠 Code PR Best Practices:
    * 📚 Documentation & Tutorials
    * 🌐 Translations and Internationalization
    * 🌎 Accessibility Matters
    * 🤔 Questions & Feedback
    * 🚨 Reporting Issues
    * 🧭 Scope of Support
  * 🙏 Thank You!



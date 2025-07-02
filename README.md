# Fabric-Mod-Template-Generator

## Overview

The Fabric Mod Template Generator is a web-based tool designed to simplify the creation of mod templates for Minecraft using the Fabric modding framework. Users can input mod-specific details, select versions for Minecraft, Fabric Loader, Yarn Mappings, Fabric API, Loom, and Gradle, and configure additional settings such as environment, license, and optional features like Mixins and README generation. Upon submission, the tool generates a ZIP file containing a complete mod template, including Gradle build files, Java source files, and configuration files tailored to the user's specifications.

The project is built with HTML, CSS, and JavaScript, utilizing libraries such as JSZip for ZIP file generation and FileSaver.js for downloading the generated files. The interface is styled with a modern, responsive design and fetches version data dynamically from Fabric and Gradle APIs.

#### Note: This is currently a test version of the tool. While it generally works as intended, there may be minor bugs or issues. Please report any problems you encounter to help improve the tool.

## Features

- Input fields for mod metadata (name, ID, main class, group ID, artifact ID, version, description, authors, website).
- Dropdowns for selecting compatible versions of Minecraft, Fabric Loader, Yarn Mappings, Fabric API, Loom, and Gradle.
- Options to configure the mod environment (client, server, or both), license (MIT, Apache-2.0 or All-Rights-Reserved), and additional features like Mixins and README generation.
- Validation for input fields to ensure correct formatting (e.g., mod ID must be lowercase, main class must be a valid Java class path).
- Dynamic generation of a ZIP file containing all necessary files for a Fabric mod project.
- Responsive design optimized for desktop and mobile devices.

## Live Preview

The tool is hosted on GitHub Pages and can be accessed [here](https://mochensky.github.io/Fabric-Mod-Template-Generator/). The live preview allows users to interact with the tool directly in their browser, input their mod details, and download the generated mod template.

## Installation

No installation is required to use the tool, as it runs entirely in the browser. To run the project locally or contribute to its development, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/mochensky/Fabric-Mod-Template-Generator.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Fabric-Mod-Template-Generator
   ```
3. Open `index.html` in a web browser to use the tool locally.

Alternatively, you can serve the project using a local development server (e.g., with Python):
   ```bash
   python -m http.server 8000
   ```
Then, access the tool at `http://localhost:8000`.

## Usage

1. Visit the live preview [here](https://mochensky.github.io/Fabric-Mod-Template-Generator/) or run the project locally.
2. Fill in the required fields in the "Basic Information" section (Mod Name, Mod ID, Main Class, Group ID, Artifact ID, Version).
3. Select the desired versions for Minecraft, Fabric Loader, Yarn Mappings, Fabric API, Loom, and Gradle in the "Versions & Dependencies" section.
4. Configure additional settings such as environment, license, description, authors, website, and optional features (Mixins, README).
5. Click the "Generate Mod Template" button to download a ZIP file containing the mod template.
6. Extract the ZIP file and use the generated project with your preferred Java IDE to start developing your Fabric mod.

## Project Structure

- `index.html`: The main HTML file containing the form structure and layout.
- `styles.css`: Stylesheet for the responsive UI design.
- `index.js`: JavaScript logic for form handling, version fetching, input validation, and ZIP file generation.
- `files/`: Directory containing static files (`gradlew`, `gradlew.bat`) included in the generated mod template.

## Dependencies

- [JSZip](https://stuk.github.io/jszip/) (v3.10.1): Used for generating ZIP files.
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) (v2.0.5): Used for triggering file downloads in the browser.
- [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter): Used for typography in the UI.

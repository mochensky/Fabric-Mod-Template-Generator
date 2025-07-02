document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('modForm');
    const errorElement = document.getElementById('error');
    
    form.style.display = 'none';
    
    loadVersions().then(() => {
        form.style.display = 'block';
    }).catch(err => {
        showError('Failed to load versions: ' + err.message);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorElement.classList.add('hidden');
        
        const formData = {
            modName: document.getElementById('modName').value.trim(),
            modId: document.getElementById('modId').value.trim(),
            mainClass: document.getElementById('mainClass').value.trim(),
            loomVersion: document.getElementById('loomVersion').value,
            environment: document.getElementById('environment').value,
            useMixins: document.getElementById('useMixins').checked,
            description: document.getElementById('description').value.trim(),
            authors: document.getElementById('authors').value.trim().split(',').map(s => s.trim()).filter(s => s),
            website: document.getElementById('website').value.trim(),
            groupId: document.getElementById('groupId').value.trim(),
            artifactId: document.getElementById('artifactId').value.trim(),
            version: document.getElementById('version').value.trim(),
            gradleVersion: document.getElementById('gradleVersion').value,
            license: document.getElementById('license').value,
            createReadme: document.getElementById('createReadme').checked,
            minecraftVersion: document.getElementById('minecraftVersion').value,
            loaderVersion: document.getElementById('loaderVersion').value,
            yarnVersion: document.getElementById('yarnVersion').value,
            fabricApiVersion: document.getElementById('fabricApiVersion').value,
        };

        if (!formData.modName) return showError('Mod Name is required');
        if (!/^[a-z0-9-]+$/.test(formData.modId)) return showError('Mod ID must be lowercase letters, numbers, or hyphens');
        if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*\.[A-Z][A-Za-z0-9]*$/.test(formData.mainClass)) return showError('Main Class must be a valid Java class path (e.g., com.example.mymod.MyMod)');
        if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(formData.groupId)) return showError('Group ID must be a valid Java package');
        if (!/^[a-z][a-z0-9-]*$/.test(formData.artifactId)) return showError('Artifact ID must be lowercase letters, numbers, or hyphens');
        if (!/^[0-9]+(\.[0-9]+)*$/.test(formData.version)) return showError('Version must be in format like 1.0.0');
        if (!formData.minecraftVersion) return showError('Minecraft Version is required');
        if (!formData.loaderVersion) return showError('Fabric Loader Version is required');
        if (!formData.yarnVersion) return showError('Yarn Version is required');
        if (!formData.fabricApiVersion && formData.environment !== 'server') return showError('Fabric API Version is required for client or both environments');
        if (!formData.gradleVersion) return showError('Gradle Version is required');
        if (!formData.loomVersion) return showError('Loom Version is required');

        try {
            const zip = new JSZip();
            const modFolder = zip.folder(formData.modName);

            modFolder.file('settings.gradle', generateSettingsGradle(formData));
            modFolder.file('build.gradle', generateRootBuildGradle(formData));
            modFolder.file('gradle.properties', generateGradleProperties(formData));
            modFolder.file('gradle/wrapper/gradle-wrapper.properties', generateGradleWrapperProperties(formData));
            modFolder.file('gradlew', await (await fetch('files/gradlew')).text());
            modFolder.file('gradlew.bat', await (await fetch('files/gradlew.bat')).text());
            modFolder.file(`mc${formData.minecraftVersion.replace(/\./g, '_')}/build.gradle`, generateSubBuildGradle(formData));
            modFolder.file(`mc${formData.minecraftVersion.replace(/\./g, '_')}/src/main/java/${formData.mainClass.replace(/\./g, '/')}.java`, generateMainClass(formData));
            if (formData.environment !== 'server') {
                modFolder.file(`mc${formData.minecraftVersion.replace(/\./g, '_')}/src/main/java/${formData.mainClass.substring(0, formData.mainClass.lastIndexOf('.')).replace(/\./g, '/')}/client/${formData.mainClass.split('.').pop()}Client.java`, generateClientClass(formData));
            }
            if (formData.useMixins) {
                modFolder.file(`main/${formData.modId}.mixins.json`, generateMixinsJson(formData));
            }
            modFolder.file(`main/fabric.mod.json`, generateFabricModJson(formData));
            modFolder.file(`main/assets/${formData.modId}/icon.png`, '');
            if (formData.createReadme) {
                modFolder.file('README.md', generateReadme(formData));
            }
            modFolder.file('LICENSE.txt', generateLicense(formData));

            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, `${formData.modName}.zip`);
        } catch (err) {
            showError('Error generating mod template: ' + err.message);
        }
    });

    function showError(message) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    function generateSettingsGradle(data) {
        return `pluginManagement {
    repositories {
        maven {
            name = 'Fabric'
            url = 'https://maven.fabricmc.net/'
        }
        gradlePluginPortal()
    }
}

rootProject.name = '${data.artifactId}'
include 'mc${data.minecraftVersion.replace(/\./g, '_')}'
`;
    }

    function generateRootBuildGradle(data) {
        return `plugins {
    id 'fabric-loom' version '${data.loomVersion}' apply false
    id 'java'
}

allprojects {
    apply plugin: 'java'
    group = project.maven_group
    version = project.mod_version
}

subprojects {
    apply plugin: 'fabric-loom'
    apply plugin: 'java'

    repositories {
        maven {
            name = 'Fabric'
            url = 'https://maven.fabricmc.net/'
        }
        mavenCentral()
    }

    base {
        archivesName = archives_base_name
    }

    tasks.withType(JavaCompile).configureEach {
        options.encoding = 'UTF-8'
    }

    java {
        withSourcesJar()
    }
}
`;
    }

    function generateGradleProperties(data) {
        return `org.gradle.jvmargs=-Xmx2G
mod_version=${data.version}
maven_group=${data.groupId}
archives_base_name=${data.artifactId}
`;
    }

    function generateGradleWrapperProperties(data) {
        return `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${data.gradleVersion}-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
    }

    function generateSubBuildGradle(data) {
        const javaVersion = getJavaVersion(data.minecraftVersion);
        return `plugins {
    id 'fabric-loom'
}

sourceSets {
    main {
        java {
            srcDirs 'src/main/java'
        }
        resources {
            srcDirs 'src/main/resources', '../main'
        }
    }
}

def version_suffix = '${data.minecraftVersion}'

dependencies {
    minecraft "com.mojang:minecraft:${data.minecraftVersion}"
    mappings "net.fabricmc:yarn:${data.yarnVersion}:v2"
    modImplementation "net.fabricmc:fabric-loader:${data.loaderVersion}"
    ${data.fabricApiVersion && data.environment !== 'server' ? `modImplementation "net.fabricmc.fabric-api:fabric-api:${data.fabricApiVersion}"` : '// No Fabric API for server-only or missing version'}
}

processResources {
    inputs.property 'version', project.version
    inputs.property 'loader_version', '${data.loaderVersion}'
    inputs.property 'minecraft_version_range', '${data.minecraftVersion}'
    filteringCharset 'UTF-8'

    filesMatching('fabric.mod.json') {
        expand 'version': project.version,
                'loader_version': '${data.loaderVersion}',
                'minecraft_version_range': '${data.minecraftVersion}'
    }

    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

tasks.withType(JavaCompile).configureEach {
    options.release.set(${javaVersion})
}

tasks.named('sourcesJar') {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

remapJar {
    archiveVersion = "\${project.version}-mc\${version_suffix}"
    destinationDirectory = file("\${project.rootDir}/build/libs")
}

remapSourcesJar {
    archiveVersion = "\${project.version}-mc\${version_suffix}"
    destinationDirectory = file("\${project.rootDir}/build/libs")
}
`;
    }

    function generateMainClass(data) {
        const className = data.mainClass.split('.').pop();
        return `package ${data.mainClass.substring(0, data.mainClass.lastIndexOf('.'))};

import net.fabricmc.api.ModInitializer;

public class ${className} implements ModInitializer {
    @Override
    public void onInitialize() {
        System.out.println("${data.modName} initialized for Minecraft ${data.minecraftVersion}!");
    }
}
`;
    }

    function generateClientClass(data) {
        const className = data.mainClass.split('.').pop();
        return `package ${data.mainClass.substring(0, data.mainClass.lastIndexOf('.'))}.client;

import net.fabricmc.api.ClientModInitializer;

public class ${className}Client implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        System.out.println("${data.modName} client initialized for Minecraft ${data.minecraftVersion}!");
    }
}
`;
    }

    function generateMixinsJson(data) {
        return `{
  "required": true,
  "minVersion": "0.8",
  "package": "${data.groupId}.${data.modId}.mixin",
  "compatibilityLevel": "JAVA_${getJavaVersion(data.minecraftVersion)}",
  "mixins": [],
  "client": [],
  "injectors": {
    "defaultRequire": 1
  },
  "overwrites": {
    "requireAnnotations": true
  }
}
`;
    }

    function generateFabricModJson(data) {
        const authors = data.authors.length ? `[${data.authors.map(a => `"${a}"`).join(', ')}]` : '[]';
        const contact = data.website ? `{ "homepage": "${data.website}" }` : '{}';
        const className = data.mainClass.split('.').pop();
        const clientEntry = data.environment !== 'server' ? `[
        "${data.mainClass}.client.${className}Client"
    ]` : '[]';
        const mixins = data.useMixins ? `["${data.modId}.mixins.json"]` : '[]';
        const env = data.environment === 'both' ? '*' : data.environment;
        return `{
  "schemaVersion": 1,
  "id": "${data.modId}",
  "version": "\${version}",
  "name": "${data.modName}",
  "description": "${data.description || 'This is a template mod.'}",
  "authors": ${authors},
  "contact": ${contact},
  "license": "${data.license}",
  "icon": "assets/${data.modId}/icon.png",
  "environment": "${env}",
  "entrypoints": {
    "main": [
      "${data.mainClass}"
    ],
    "client": ${clientEntry}
  },
  "mixins": ${mixins},
  "depends": {
    "fabricloader": ">=\${loader_version}",
    "fabric": "*",
    "minecraft": "\${minecraft_version_range}"
  }
}
`;
    }

    function generateReadme(data) {
        return `# ${data.modName}

${data.description || 'A template mod for Minecraft using Fabric.'}

## Building

\`\`\`bash
./gradlew build
\`\`\`

The built mod will be in the \`build/libs\` directory.

## License

${data.license}
`;
    }

    function generateLicense(data) {
        if (data.license === 'MIT') {
            return `MIT License

Copyright (c) ${new Date().getFullYear()} ${data.authors.join(', ') || 'Author'}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
        } else if (data.license === 'Apache-2.0') {
            return `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

[Full Apache 2.0 license text here]
`;
        } else {
            return `Copyright (c) ${new Date().getFullYear()} ${data.authors.join(', ') || 'Author'}\nAll rights reserved`;
        }
    }

    function getJavaVersion(minecraftVersion) {
        const majorVersion = parseInt(minecraftVersion.split('.')[1]);
        if (majorVersion >= 21) return 21;
        if (majorVersion >= 17) return 17;
        return 8;
    }

    function compareVersions(a, b) {
        const cleanA = a.replace(/[-+].*$/, '');
        const cleanB = b.replace(/[-+].*$/, '');
        const partsA = cleanA.split('.').map(Number);
        const partsB = cleanB.split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA !== numB) return numB - numA;
        }
        if (a.includes('-SNAPSHOT') && !b.includes('-SNAPSHOT')) return -1;
        if (!a.includes('-SNAPSHOT') && b.includes('-SNAPSHOT')) return 1;
        return 0;
    }

    async function loadVersions() {
    try {
        const [response, gradleResponse, loomResponse, fabricApiResponse] = await Promise.all([
            fetch('https://meta.fabricmc.net/v2/versions/'),
            fetch('https://services.gradle.org/versions/all'),
            fetch('https://maven.fabricmc.net/net/fabricmc/fabric-loom/maven-metadata.xml'),
            fetch('https://api.modrinth.com/v2/project/fabric-api/version')
        ]);

        if (!response.ok) throw new Error('Failed to fetch Fabric versions');
        if (!gradleResponse.ok) throw new Error('Failed to fetch Gradle versions');
        if (!loomResponse.ok) throw new Error('Failed to fetch Loom versions');
        if (!fabricApiResponse.ok) throw new Error('Failed to fetch Fabric API versions');

        const versions = await response.json();
        const minecraftSelect = document.getElementById('minecraftVersion');
        const stableVersions = versions.game
            .filter(v => v.stable)
            .sort((a, b) => compareVersions(a.version, b.version));
        stableVersions.forEach(v => {
            const option = document.createElement('option');
            option.value = v.version;
            option.textContent = v.version;
            minecraftSelect.appendChild(option);
        });

        const latestMinecraftVersion = stableVersions[0]?.version || '';
        minecraftSelect.value = latestMinecraftVersion;

        const gradleVersions = await gradleResponse.json();
        const gradleSelect = document.getElementById('gradleVersion');
        gradleVersions
            .filter(v => !v.snapshot && !v.version.includes('-'))
            .sort((a, b) => compareVersions(a.version, b.version))
            .forEach(v => {
                const option = document.createElement('option');
                option.value = v.version;
                option.textContent = v.version;
                gradleSelect.appendChild(option);
            });
        gradleSelect.value = gradleVersions
            .filter(v => !v.snapshot && !v.version.includes('-'))
            .sort((a, b) => compareVersions(a.version, b.version))[0]?.version || '';

        const loomText = await loomResponse.text();
        const loomParser = new DOMParser();
        const loomXml = loomParser.parseFromString(loomText, 'text/xml');
        const loomVersions = Array.from(loomXml.querySelectorAll('version'))
            .map(v => v.textContent)
            .filter(v => !v.includes('-pre') && !v.includes('-rc'))
            .sort(compareVersions);
        const loomSelect = document.getElementById('loomVersion');
        loomVersions.forEach(v => {
            const option = document.createElement('option');
            option.value = v;
            option.textContent = v;
            loomSelect.appendChild(option);
        });
        loomSelect.value = loomVersions[0] || '';

        const fabricApiVersions = await fabricApiResponse.json();

        async function updateDependentDropdowns() {
            const version = minecraftSelect.value;
            if (!version) return;

            const loaderSelect = document.getElementById('loaderVersion');
            const yarnSelect = document.getElementById('yarnVersion');
            const apiSelect = document.getElementById('fabricApiVersion');

            loaderSelect.innerHTML = '';
            yarnSelect.innerHTML = '';
            apiSelect.innerHTML = '';

            try {
                const [loaderRes, yarnRes] = await Promise.all([
                    fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`),
                    fetch(`https://meta.fabricmc.net/v2/versions/yarn/${version}`)
                ]);

                if (!loaderRes.ok) throw new Error('Failed to fetch loader versions');
                if (!yarnRes.ok) throw new Error('Failed to fetch Yarn mappings');

                const loaders = await loaderRes.json();
                const yarns = await yarnRes.json();

                const apiVersions = fabricApiVersions
                    .filter(v => v.game_versions.includes(version))
                    .map(v => v.version_number)
                    .sort(compareVersions);

                loaders
                    .sort((a, b) => compareVersions(a.loader.version, b.loader.version))
                    .forEach(l => {
                        const option = document.createElement('option');
                        option.value = l.loader.version;
                        option.textContent = l.loader.version;
                        loaderSelect.appendChild(option);
                    });
                loaderSelect.value = loaders.find(l => l.loader.stable)?.loader.version || loaders[0]?.loader.version || '';

                yarns
                    .sort((a, b) => compareVersions(a.version, b.version))
                    .forEach(y => {
                        const option = document.createElement('option');
                        option.value = y.version;
                        option.textContent = y.version;
                        yarnSelect.appendChild(option);
                    });
                yarnSelect.value = yarns[0]?.version || '';

                apiVersions.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v;
                    option.textContent = v;
                    apiSelect.appendChild(option);
                });
                apiSelect.value = apiVersions[0] || '';
            } catch (err) {
                showError('Error updating dependent versions: ' + err.message);
            }
        }

        minecraftSelect.addEventListener('change', updateDependentDropdowns);

        if (latestMinecraftVersion) {
            await updateDependentDropdowns();
        }
    } catch (err) {
        showError('Error loading versions: ' + err.message);
    }
    }
});
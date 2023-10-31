var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/main.ts
__export(exports, {
  default: () => ThePlugin
});
var import_obsidian6 = __toModule(require("obsidian"));

// src/SettingsTab.ts
var import_obsidian = __toModule(require("obsidian"));
var SettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: this.plugin.appName });
    new import_obsidian.Setting(containerEl).setName("Auto-update at startup").setDesc("If enabled all beta plugins will be checked for updates each time Obsidian starts.").addToggle((cb) => {
      cb.setValue(this.plugin.settings.updateAtStartup);
      cb.onChange(async (value) => {
        this.plugin.settings.updateAtStartup = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("hr");
    containerEl.createEl("h2", { text: "Beta Plugin List" });
    containerEl.createEl("div", { text: `The following is a list of beta plugins added via the command palette "Add a beta plugin for testing". ` });
    containerEl.createEl("p");
    containerEl.createEl("div", { text: `Click the x button next to a plugin to remove it from the list.` });
    containerEl.createEl("p");
    containerEl.createEl("span").createEl("b", { text: "Note: " });
    containerEl.createSpan({ text: "This does not delete the plugin, this should be done from the  Community Plugins tab in Settings." });
    for (const bp of this.plugin.settings.pluginList) {
      new import_obsidian.Setting(containerEl).setName(bp).addButton((btn) => {
        btn.setIcon("cross");
        btn.setTooltip("Delete this beta plugin");
        btn.onClick(async () => {
          if (btn.buttonEl.textContent === "")
            btn.setButtonText("Click once more to confirm removal");
          else {
            btn.buttonEl.parentElement.parentElement.remove();
            await this.plugin.betaPlugins.deletePlugin(bp);
          }
        });
      });
    }
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  pluginList: [],
  updateAtStartup: false
};
async function addBetaPluginToList(plugin, repositoryPath) {
  if (!plugin.settings.pluginList.contains(repositoryPath)) {
    plugin.settings.pluginList.push(repositoryPath);
    plugin.saveSettings();
  }
}
async function existBetaPluginInList(plugin, repositoryPath) {
  return plugin.settings.pluginList.contains(repositoryPath);
}

// src/AddNewPluginModal.ts
var import_obsidian2 = __toModule(require("obsidian"));
var AddNewPluginModal = class extends import_obsidian2.Modal {
  constructor(plugin, betaPlugins) {
    super(plugin.app);
    this.plugin = plugin;
    this.betaPlugins = betaPlugins;
    this.address = "";
  }
  async submitForm() {
    if (this.address === "")
      return;
    const scrubbedAddress = this.address.replace("https://github.com/", "");
    if (await existBetaPluginInList(this.plugin, scrubbedAddress)) {
      new import_obsidian2.Notice(`BRAT
This plugin is already in the list for beta testing`, 2e4);
      return;
    }
    const result = await this.betaPlugins.addPlugin(scrubbedAddress);
    if (result)
      this.close();
  }
  onOpen() {
    this.contentEl.createEl("h4", { text: "Github repository for beta plugin:" });
    this.contentEl.createEl("form", {}, (formEl) => {
      new import_obsidian2.Setting(formEl).addText((textEl) => {
        textEl.setPlaceholder("Repository (example: TfTHacker/obsidian-brat");
        textEl.onChange((value) => {
          this.address = value.trim();
        });
        textEl.inputEl.addEventListener("keydown", async (e) => {
          if (e.key === "Enter" && this.address !== " ") {
            e.preventDefault();
            await this.submitForm();
          }
        });
        textEl.inputEl.style.width = "100%";
        window.setTimeout(() => {
          const title = document.querySelector(".setting-item-info");
          if (title)
            title.remove();
          textEl.inputEl.focus();
        }, 10);
      });
      formEl.createDiv("modal-button-container", (buttonContainerEl) => {
        buttonContainerEl.createEl("button", { attr: { type: "button" }, text: "Never mind" }).addEventListener("click", () => this.close());
        buttonContainerEl.createEl("button", {
          attr: { type: "submit" },
          cls: "mod-cta",
          text: "Add Plugin"
        });
      });
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (this.address !== "")
          await this.submitForm();
      });
    });
  }
};

// src/githubUtils.ts
var import_obsidian3 = __toModule(require("obsidian"));
var GITHUB_RAW_USERCONTENT_PATH = "https://raw.githubusercontent.com/";
var grabReleaseFileFromRepository = async (repository, version, fileName) => {
  try {
    const download = await (0, import_obsidian3.request)({ url: `https://github.com/${repository}/releases/download/${version}/${fileName}` });
    return download === "Not Found" ? null : download;
  } catch (error) {
    console.log("error in grabReleaseFileFromRepository", error);
  }
};
var grabManifestJsonFromRepository = async (repositoryPath, rootManifest = true) => {
  const manifestJsonPath = GITHUB_RAW_USERCONTENT_PATH + repositoryPath + (rootManifest === true ? "/HEAD/manifest.json" : "/HEAD/manifest-beta.json");
  try {
    const response = await (0, import_obsidian3.request)({ url: manifestJsonPath });
    return response === "404: Not Found" ? null : await JSON.parse(response);
  } catch (error) {
    console.log("error in grabManifestJsonFromRepository", error);
  }
};

// src/BetaPlugins.ts
var import_obsidian4 = __toModule(require("obsidian"));
var BetaPlugins = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  async displayAddNewPluginModal() {
    const newPlugin = new AddNewPluginModal(this.plugin, this);
    newPlugin.open();
  }
  async validateRepository(repositoryPath, getBetaManifest = false, reportIsues = false) {
    const noticeTimeout = 6e4;
    const manifestJson = await grabManifestJsonFromRepository(repositoryPath, !getBetaManifest);
    if (!manifestJson) {
      if (reportIsues)
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
This does not seem to be an obsidian plugin, as there is no manifest.json file.`, noticeTimeout);
      return null;
    }
    if (!("id" in manifestJson)) {
      if (reportIsues)
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
The plugin id attribute for the release is missing from the manifest file`, noticeTimeout);
      return null;
    }
    if (!("version" in manifestJson)) {
      if (reportIsues)
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
The version attribute for the release is missing from the manifest file`, noticeTimeout);
      return null;
    }
    return manifestJson;
  }
  async getAllReleaseFiles(repositoryPath, manifest) {
    return {
      mainJs: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "main.js"),
      manifest: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "manifest.json"),
      styles: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "styles.css")
    };
  }
  async writeReleaseFilesToPluginFolder(betaPluginID, relFiles) {
    const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + betaPluginID + "/";
    if (await this.plugin.app.vault.adapter.exists(pluginTargetFolderPath) === false || !await this.plugin.app.vault.adapter.exists(pluginTargetFolderPath + "manifest.json")) {
      await this.plugin.app.vault.adapter.mkdir(pluginTargetFolderPath);
    }
    await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "main.js", relFiles.mainJs);
    await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "manifest.json", relFiles.manifest);
    if (relFiles.styles)
      await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "styles.css", relFiles.styles);
  }
  async addPlugin(repositoryPath, updatePluginFiles = false) {
    const manifestJson = await this.validateRepository(repositoryPath, false, true);
    const noticeTimeout = 6e4;
    if (manifestJson === null)
      return false;
    const betaManifestJson = await this.validateRepository(repositoryPath, true, false);
    const primaryManifest = betaManifestJson ? betaManifestJson : manifestJson;
    const releaseFiles = await this.getAllReleaseFiles(repositoryPath, primaryManifest);
    if (releaseFiles.mainJs === "Not Found") {
      new import_obsidian4.Notice(`BRAT
${repositoryPath}
The release is not complete and cannot be download. main.js is missing from the release`, noticeTimeout);
      return false;
    }
    if (releaseFiles.manifest === "Not Found") {
      new import_obsidian4.Notice(`BRAT
${repositoryPath}
The release is not complete and cannot be download. manifest.json is missing from the release`, noticeTimeout);
      return false;
    }
    const remoteManifestJSON = JSON.parse(releaseFiles.manifest);
    if (updatePluginFiles === false) {
      await this.writeReleaseFilesToPluginFolder(remoteManifestJSON.id, releaseFiles);
      await addBetaPluginToList(this.plugin, repositoryPath);
      new import_obsidian4.Notice(`BRAT
${repositoryPath}
The plugin has been installed and now needs to be enabled in Community Plugins in Settings. First refresh community plugins and then enable this plugin`, noticeTimeout);
    } else {
      const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + remoteManifestJSON.id + "/";
      let localManifestContents = null;
      try {
        localManifestContents = await this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json");
      } catch (e) {
        if (e.errno === -4058) {
          await this.addPlugin(repositoryPath, false);
          return true;
        } else
          console.log("BRAT - Local Manifest Load", remoteManifestJSON.id, JSON.stringify(e, null, 2));
      }
      const localManifestJSON = await JSON.parse(localManifestContents);
      if (localManifestJSON.version !== remoteManifestJSON.version) {
        await this.writeReleaseFilesToPluginFolder(remoteManifestJSON.id, releaseFiles);
        await this.reloadPlugin(remoteManifestJSON.id);
        new import_obsidian4.Notice(`BRAT
${remoteManifestJSON.id}
plugin has been updated and reloaded`, noticeTimeout);
      }
    }
    return true;
  }
  async reloadPlugin(pluginName) {
    const plugins = this.plugin.app.plugins;
    try {
      await plugins.disablePlugin(pluginName);
      await plugins.enablePlugin(pluginName);
    } catch (e) {
      console.log("reload plugin", e);
    }
  }
  async updatePlugin(repositoryPath) {
    const result = await this.addPlugin(repositoryPath, true);
    if (result === false)
      new import_obsidian4.Notice(`BRAT
${repositoryPath}
Update of plugin failed.`);
  }
  async checkForUpdates(showInfo = false) {
    if (showInfo)
      new import_obsidian4.Notice(`BRAT
Checking for plugin updates STARTED`, 3e4);
    for (const bp of this.plugin.settings.pluginList) {
      await this.updatePlugin(bp);
    }
    if (showInfo)
      new import_obsidian4.Notice(`BRAT
Checking for plugin updates COMPLETED`, 1e4);
  }
  async deletePlugin(repositoryPath) {
    this.plugin.settings.pluginList = this.plugin.settings.pluginList.filter((b) => b != repositoryPath);
    this.plugin.saveSettings();
  }
};

// src/GenericFuzzySuggester.ts
var import_obsidian5 = __toModule(require("obsidian"));
var GenericFuzzySuggester = class extends import_obsidian5.FuzzySuggestModal {
  constructor(plugin) {
    super(plugin.app);
    this.scope.register(["Shift"], "Enter", (evt) => this.enterTrigger(evt));
    this.scope.register(["Ctrl"], "Enter", (evt) => this.enterTrigger(evt));
  }
  setSuggesterData(suggesterData) {
    this.data = suggesterData;
  }
  async display(callBack) {
    this.callbackFunction = callBack;
    this.open();
  }
  getItems() {
    return this.data;
  }
  getItemText(item) {
    return item.display;
  }
  onChooseItem() {
    return;
  }
  renderSuggestion(item, el) {
    el.createEl("div", { text: item.item.display });
  }
  enterTrigger(evt) {
    const selectedText = document.querySelector(".suggestion-item.is-selected div").textContent;
    const item = this.data.find((i) => i.display === selectedText);
    if (item) {
      this.invokeCallback(item, evt);
      this.close();
    }
  }
  onChooseSuggestion(item, evt) {
    this.invokeCallback(item.item, evt);
  }
  invokeCallback(item, evt) {
    this.callbackFunction(item, evt);
  }
};

// src/main.ts
var ThePlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
    this.appID = "obsidian42-brat";
  }
  async onload() {
    console.log("loading " + this.appName);
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));
    this.betaPlugins = new BetaPlugins(this);
    this.addCommand({
      id: "BRAT-AddBetaPlugin",
      name: "Add a beta plugin for testing",
      callback: async () => {
        await this.betaPlugins.displayAddNewPluginModal();
      }
    });
    this.addCommand({
      id: "BRAT-checkForUpdates",
      name: "Check for updates to beta plugins",
      callback: async () => {
        await this.betaPlugins.checkForUpdates(true);
      }
    });
    this.addCommand({
      id: "BRAT-restart plugin",
      name: "Restart a plugin that is already installed",
      callback: async () => {
        const pluginList = Object.values(this.app.plugins.manifests).map((m) => {
          return { display: m.id, info: m.id };
        });
        const gfs = new GenericFuzzySuggester(this);
        gfs.setSuggesterData(pluginList);
        await gfs.display(async (results) => {
          new import_obsidian6.Notice(`${results.info}
Plugin reloading .....`, 5e3);
          await this.betaPlugins.reloadPlugin(results.info);
        });
      }
    });
    this.app.workspace.onLayoutReady(() => {
      if (this.settings.updateAtStartup)
        setTimeout(async () => {
          await this.betaPlugins.checkForUpdates(false);
        }, 6e4);
    });
  }
  onunload() {
    console.log("unloading " + this.appName);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};


import { Plugin, PanelManager, SettingsTypes } from '@camelkit/core';
import panelHtml from '../resources/html/panel.html';
import panelCss from '../resources/css/panel.css';

export default class SessionTimerPlugin extends Plugin {
  pluginName = 'Session Timer';
  author = 'jrumbolt';

  private readonly menuIcon = '⏱️';
  private panelManager = new PanelManager();
  private panelElement: HTMLElement | null = null;
  private chatClockElement: HTMLSpanElement | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;

  constructor() {
    super();

    this.settings.showOnScreen = {
      text: 'Show on chatbox',
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => this.onChatboxSettingChanged(),
    };

    this.settings.showOverlayBackground = {
      text: 'Toggle background',
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => this.onBackgroundSettingChanged(),
    };
  }

  init(): void {
    if (typeof this.data.showOnScreen === 'boolean') {
      this.settings.showOnScreen.value = this.data.showOnScreen;
    } else {
      this.data.showOnScreen = true;
    }

    if (typeof this.data.showOverlayBackground === 'boolean') {
      this.settings.showOverlayBackground.value = this.data.showOverlayBackground;
    } else {
      this.data.showOverlayBackground = true;
    }

    this.info('Session Timer initialized.');
  }

  start(): void {
    this.clearTimer();
    this.removeChatClock();
    this.styleElement?.remove();
    this.styleElement = null;

    if (this.panelElement) {
      this.panelManager.removeMenuItem(this.menuIcon);
      this.panelElement = null;
    }

    this.startedAt = Date.now();

    const [, panelContainer] = this.panelManager.requestMenuItem(
      this.menuIcon,
      'Session Timer'
    );

    this.panelElement = panelContainer;
    panelContainer.innerHTML = panelHtml;

    const chatboxToggle = panelContainer.querySelector<HTMLInputElement>(
      '#session-overlay-toggle'
    );

    if (chatboxToggle) {
      chatboxToggle.checked = Boolean(this.settings.showOnScreen.value);

      chatboxToggle.addEventListener('change', () => {
        const enabled = chatboxToggle.checked;

        this.settings.showOnScreen.value = enabled;
        this.data.showOnScreen = enabled;

        this.updateChatboxVisibility();
        this.updateBackgroundToggleState();
      });
    }

    const backgroundToggle = panelContainer.querySelector<HTMLInputElement>(
      '#session-overlay-background-toggle'
    );

    if (backgroundToggle) {
      backgroundToggle.checked = Boolean(this.settings.showOverlayBackground.value);

      backgroundToggle.addEventListener('change', () => {
        const enabled = backgroundToggle.checked;

        this.settings.showOverlayBackground.value = enabled;
        this.data.showOverlayBackground = enabled;

        this.updateChatboxBackground();
      });
    }

    this.updateBackgroundToggleState();

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = panelCss;
    document.head.appendChild(this.styleElement);

    this.updateDisplay();
    this.intervalId = setInterval(() => this.updateDisplay(), 1000);

    this.info('Session Timer started.');
  }

  stop(): void {
    this.clearTimer();
    this.removeChatClock();

    this.styleElement?.remove();
    this.styleElement = null;

    this.panelManager.removeMenuItem(this.menuIcon);
    this.panelElement = null;
    this.startedAt = 0;

    this.info('Session Timer stopped.');
  }

  private onChatboxSettingChanged(): void {
    const enabled = Boolean(this.settings.showOnScreen.value);

    this.data.showOnScreen = enabled;

    const toggle = this.panelElement?.querySelector<HTMLInputElement>(
      '#session-overlay-toggle'
    );

    if (toggle) {
      toggle.checked = enabled;
    }

    this.updateChatboxVisibility();
    this.updateBackgroundToggleState();
  }

  private onBackgroundSettingChanged(): void {
    const enabled = Boolean(this.settings.showOverlayBackground.value);

    this.data.showOverlayBackground = enabled;

    const toggle = this.panelElement?.querySelector<HTMLInputElement>(
      '#session-overlay-background-toggle'
    );

    if (toggle) {
      toggle.checked = enabled;
    }

    this.updateChatboxBackground();
  }

  private updateBackgroundToggleState(): void {
    const backgroundToggle = this.panelElement?.querySelector<HTMLInputElement>(
      '#session-overlay-background-toggle'
    );

    if (backgroundToggle) {
      const chatboxEnabled = Boolean(this.settings.showOnScreen.value);

      backgroundToggle.disabled = !chatboxEnabled;

      backgroundToggle.checked = chatboxEnabled
        ? Boolean(this.settings.showOverlayBackground.value)
        : false;
    }
  }

  private updateChatboxVisibility(): void {
    if (!this.panelElement || !this.settings.showOnScreen.value) {
      this.removeChatClock();
      return;
    }

    this.ensureChatClock();
    this.updateDisplay();
  }

  private ensureChatClock(): void {
    if (!this.panelElement || !this.settings.showOnScreen.value) {
      return;
    }

    const tabBar = document.querySelector<HTMLElement>(
      '#ui-chat-area .chat-tab-bar'
    );

    if (!tabBar) {
      this.removeChatClock();
      return;
    }

    if (this.chatClockElement?.parentElement === tabBar) {
      return;
    }

    this.removeChatClock();

    const clock = document.createElement('span');
    clock.className = 'session-timer-chat-clock';
    clock.setAttribute('role', 'timer');
    clock.setAttribute('aria-label', 'Session elapsed time');
    clock.textContent = '00:00:00';

    tabBar.appendChild(clock);
    this.chatClockElement = clock;

    this.updateChatboxBackground();
  }

  private updateChatboxBackground(): void {
    this.chatClockElement?.classList.toggle(
      'session-timer-chat-clock--transparent',
      !Boolean(this.settings.showOverlayBackground.value)
    );
  }

  private removeChatClock(): void {
    this.chatClockElement?.remove();
    this.chatClockElement = null;
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateDisplay(): void {
    if (this.startedAt === 0) {
      return;
    }

    this.ensureChatClock();

    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - this.startedAt) / 1000)
    );

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const twoDigits = (value: number): string =>
      String(value).padStart(2, '0');

    const formatted =
      `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`;

    const sidebarClock = this.panelElement?.querySelector<HTMLElement>(
      '#session-elapsed'
    );

    if (sidebarClock) {
      sidebarClock.textContent = formatted;
    }

    if (this.chatClockElement) {
      this.chatClockElement.textContent = formatted;
    }
  }
}
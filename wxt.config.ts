import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  // Явные импорты вместо автоимпортов: код читается без знания магии фреймворка.
  imports: false,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FormFill — заполнение форм',
    short_name: 'FormFill',
    description: 'Заполняет веб-формы тестовыми данными из ваших шаблонов в один клик.',
    permissions: ['activeTab', 'scripting', 'storage', 'contextMenus'],
    commands: {
      'fill-form': {
        suggested_key: { default: 'Alt+Shift+F' },
        description: 'Заполнить форму активным шаблоном',
      },
    },
    action: { default_title: 'FormFill' },
  },
});

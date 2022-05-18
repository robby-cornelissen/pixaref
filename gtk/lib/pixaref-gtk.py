import json
import os
import requests
from pathlib import Path

import gi
gi.require_version('Gtk', '3.0')
gi.require_version('Gdk', '3.0')
gi.require_version('AppIndicator3', '0.1')
gi.require_version('Keybinder', '3.0')

from gi.repository import Gdk, GdkPixbuf
from gi.repository import Gtk
from gi.repository import AppIndicator3 as AppIndicator
from gi.repository import Keybinder


CONFIG_FILE_NAME = 'pixaref.json'
CONFIG_PATH = os.getenv('XDG_CONFIG_HOME') or Path.home() / '.config' / CONFIG_FILE_NAME

RS_PATH = '/RS'
FS_PATH = '/FS'
REF_PATH = '/ref'
IMAGE_PATH = '/image'
TYPE_PATH = '/type'

HOST = 'host'
PREVIEW_WIDTH = 'preview_width'
PREVIEW_HEIGHT = 'preview_width'
SEND_TO_PIXAREF_SHORTCUT_KEY = 'send_to_pixaref_shortcut_key'

APP_NAME = 'Pixaref Client';
ICON_PATH = str(Path(__file__).parent.parent.resolve() / 'assets/icons/scalable/pixaref.svg')


class SendDialog():
    def __init__(self, pixbuf, state, config):
        self.pixbuf = pixbuf
        self.state = state
        self.config = config
        self.types = self.get_types();
        self.window = self.create_window()

    def create_window(self):
        preview = self.scale_pixbuf()

        image = Gtk.Image.new_from_pixbuf(preview)

        frame = Gtk.Frame()
        frame.set_shadow_type(Gtk.ShadowType.IN)
        frame.add(image)

        align = Gtk.Alignment(xalign=0.5, yalign=0.5, xscale=0, yscale=0)
        align.add(frame)

        title_label = Gtk.Label(label='Title', hexpand=True, halign=Gtk.Align.END)

        self.title_entry = Gtk.Entry(hexpand=True)

        self.type_combo = Gtk.ComboBoxText(hexpand=True)

        for t in self.types:
            self.type_combo.append_text(t)

        year_label = Gtk.Label(label='Year', hexpand=True, halign=Gtk.Align.END)

        self.year_entry = Gtk.Entry(hexpand=True, max_length=4, width_chars=4, input_purpose=Gtk.InputPurpose.DIGITS)

        tags_label = Gtk.Label(label='Tags', hexpand=True, halign=Gtk.Align.END)

        self.tags_entry = Gtk.Entry(hexpand=True)

        grid = Gtk.Grid(row_spacing=8, column_spacing=8)
        grid.attach(title_label, 0, 0, 1, 1)
        grid.attach(self.title_entry, 1, 0, 4, 1)
        grid.attach(self.type_combo, 5, 0, 1, 1)
        grid.attach(year_label, 6, 0, 1, 1)
        grid.attach(self.year_entry, 7, 0, 1, 1)
        grid.attach(tags_label, 0, 1, 1, 1)
        grid.attach(self.tags_entry, 1, 1, 7, 1)

        content_box = Gtk.VBox(border_width=16, spacing=8)
        content_box.pack_start(align, False, False, 0)
        content_box.pack_start(grid, False, False, 0)

        send_button = Gtk.Button(label='Send', margin_end=10)
        send_button.connect('clicked', self.on_send)
        send_button.get_style_context().add_class('suggested-action')

        cancel_button = Gtk.Button(label='Cancel')
        cancel_button.connect('clicked', self.on_cancel)

        action_bar = Gtk.ActionBar()
        action_bar.pack_end(send_button)
        action_bar.pack_end(cancel_button)

        main_box = Gtk.VBox()
        main_box.pack_start(content_box, False, False, 0)
        main_box.pack_start(action_bar, False, False, 0)

        window = Gtk.Window(title='Send to Pixaref', resizable=False, type_hint=Gdk.WindowTypeHint.DIALOG)
        window.add(main_box)
        window.set_position(Gtk.WindowPosition.CENTER_ALWAYS)
        window.set_default_icon_from_file(ICON_PATH)
        window.set_wmclass (APP_NAME, APP_NAME)

        self.restore_state()

        return window

    def get_types(self):
        try:
            response = requests.get(self.config[HOST] + RS_PATH + TYPE_PATH)

            if response.status_code != 200:
                body = response.json()
                
                self.on_error(body['message'])
            else:
                return [type['name'] for type in response.json()]
        except Exception as e:
            self.on_error(str(e))
            return

    def save_state(self):
        self.state['title'] = self.title_entry.get_text() or None
        self.state['type'] = self.type_combo.get_active_text() or None
        self.state['year'] = int(self.year_entry.get_text()) if self.year_entry.get_text() else None
        self.state['tags'] = list(map(
            lambda t: t.strip(),
            filter(None, self.tags_entry.get_text().split(','))
        ))
    
    def restore_state(self):
        title_text = self.state.get('title', '')
        type_text = self.state.get('type', None)
        type_index = self.types.index(type_text) if type_text in self.types else -1
        year_text = str(self.state.get('year') or '')
        tags_text = ', '.join(self.state.get('tags', []))

        self.title_entry.set_text(title_text)
        self.type_combo.set_active(type_index)
        self.year_entry.set_text(year_text)
        self.tags_entry.set_text(tags_text)

    def scale_pixbuf(self):
        max_width = self.config[PREVIEW_WIDTH]
        max_height = self.config[PREVIEW_HEIGHT]
        width = self.pixbuf.get_width()
        height = self.pixbuf.get_height()
        ratio = min(max_width / width, max_height / height)

        if ratio > 1:
            return self.pixbuf
        else:
            return self.pixbuf.scale_simple(int(width * ratio), int(height * ratio), GdkPixbuf.InterpType.BILINEAR)

    def on_send(self, _):
        self.save_state()

        (result, image) = self.pixbuf.save_to_bufferv('png', (), ())

        if not result:
            self.on_error('Error creating image buffer')
            return

        multipart_form_data = {'image': ('image.png', image, 'image/png')}
        image_descriptor = None

        try:
            response = requests.post(self.config[HOST] + FS_PATH + IMAGE_PATH, files=multipart_form_data)

            if response.status_code != 200:
                body = response.json()
                
                self.on_error(body['message'])
            else:
                image_descriptor = response.json()
        except Exception as e:
            self.on_error(str(e))
            return
        
        ref = {
            'image': image_descriptor,
            'title': self.state['title'],
            'type': self.state['type'],
            'year': self.state['year'],
            'tags': self.state['tags']
        }

        try:
            response = requests.post(self.config[HOST] + RS_PATH + REF_PATH, json=ref)

            if response.status_code != 200:
                body = response.json()
                
                self.on_error(body['message'])
            else:
                self.window.destroy()
        except Exception as e:
            self.on_error(str(e))
            return
        
    def on_cancel(self, _):
        self.window.destroy()
    
    def on_error(self, message):
        dialog = Gtk.MessageDialog(
            transient_for=self.window,
            flags=0,
            message_type=Gtk.MessageType.ERROR,
            buttons=Gtk.ButtonsType.CANCEL,
            text='An error occurred',
        )
        dialog.format_secondary_text(message)
        dialog.run()
        dialog.destroy()
    
    def show(self):
        self.window.show_all()


class ConfigDialog():
    def __init__(self, config):
        self.config = config
        self.window = self.create_window()

    def create_window(self):
        host_label = Gtk.Label(label='Host', hexpand=True, halign=Gtk.Align.END)

        host_entry = Gtk.Entry(hexpand=True)
        host_entry.set_text(self.config[HOST])

        grid = Gtk.Grid(row_spacing=8, column_spacing=8)
        grid.attach(host_label, 0, 0, 1, 1)
        grid.attach(host_entry, 1, 0, 4, 1)

        content_box = Gtk.VBox(border_width=16, spacing=8)
        content_box.pack_start(grid, False, False, 0)

        save_button = Gtk.Button(label='Save', margin_end=10)
        save_button.connect('clicked', self.on_save, host_entry)
        save_button.get_style_context().add_class('suggested-action')

        cancel_button = Gtk.Button(label='Cancel')
        cancel_button.connect('clicked', self.on_cancel)

        action_bar = Gtk.ActionBar()
        action_bar.pack_end(save_button)
        action_bar.pack_end(cancel_button)

        main_box = Gtk.VBox()
        main_box.pack_start(content_box, False, False, 0)
        main_box.pack_start(action_bar, False, False, 0)

        window = Gtk.Window(title='Configure Pixaref', resizable=False, type_hint=Gdk.WindowTypeHint.DIALOG)
        window.add(main_box)
        window.set_position(Gtk.WindowPosition.CENTER_ALWAYS)
        window.set_default_icon_from_file(ICON_PATH)
        window.set_wmclass (APP_NAME, APP_NAME)

        return window
    
    def on_save(self, _, host_entry):
        self.config[HOST] = host_entry.get_text()

        save_config(self.config)

        self.window.destroy()

    def on_cancel(self, _):
        self.window.destroy()
    
    def show(self):
        self.window.show_all()


def send(_, state, config):
    window = Gdk.get_default_root_window()
    x, y, width, height = window.get_geometry()
    pixbuf = Gdk.pixbuf_get_from_window(window, x, y, width, height)

    if pixbuf:
        dialog = SendDialog(pixbuf, state, config)
        dialog.show()
    else:
        print('Unable to get screenshot')


def configure(_, config):
    dialog = ConfigDialog(config)
    dialog.show()


def quit(w):
    Gtk.main_quit()


def load_config():
    default_config_path = Path(__file__).parent.parent.resolve() / 'conf' / CONFIG_FILE_NAME
    default_config = json.load(open(default_config_path))

    config_path = CONFIG_PATH
    config = json.load(open(config_path, 'r')) if config_path.is_file() else {}

    return {**default_config, **config}    


def save_config(config):
    Path(CONFIG_PATH).parent.mkdir(parents=True, exist_ok=True)

    json.dump(config, open(CONFIG_PATH, 'w'), indent=4)


def main(config, state):
    send_item = Gtk.MenuItem(label='Send to Pixaref')
    send_item.connect('activate', send, state, config)
    send_item.show()

    configure_item = Gtk.MenuItem(label='Configure Pixaref')
    configure_item.connect('activate', configure, config)
    configure_item.show()

    quit_item = Gtk.MenuItem(label='Quit')
    quit_item.connect('activate', quit)
    quit_item.show()

    menu = Gtk.Menu()
    menu.append(send_item)
    menu.append(configure_item)
    menu.append(Gtk.SeparatorMenuItem())
    menu.append(quit_item)

    indicator = AppIndicator.Indicator.new(
        'pixaref-gtk',
        ICON_PATH,
        AppIndicator.IndicatorCategory.OTHER)
    indicator.set_status(AppIndicator.IndicatorStatus.ACTIVE)
    indicator.set_menu(menu)

    Keybinder.init()
    Keybinder.bind(config[SEND_TO_PIXAREF_SHORTCUT_KEY], send, state, config)

    Gtk.main()

if __name__ == '__main__':
    config = load_config()
    state = {}

    main(config, state)

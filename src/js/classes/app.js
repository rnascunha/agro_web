import app_detail_html from '../containers/main/app_detail.html'
import {format_date_time} from '../helper/date_format.js'
import {message_types, app_commands} from '../messages/types.js'

const attr = ['id', 'name', 'version', 'size', 'hash', 'description', 'uploader', 'date_upload'];

class App{
  constructor({id, name, version, size, hash, description, uploader, date_upload})
  {
    this._id = id;
    this._name = name;
    this._version = version;
    this._size = size;
    this._hash = hash;
    this._description = description;
    this._uploader = uploader;
    this._date_upload = date_upload;
  }

  get id(){ return this._id; }
  get name(){ return this._name; }
  get version(){ return this._version; }
  get size(){ return this._size; }
  get hash(){ return this._hash; }
  get description(){ return this._description; }
  get uploader(){ return this._uploader; }
  get date_upload(){ return this._date_upload; }
}

export class App_List{
  constructor(container)
  {
    this._list = {};
    this._view = new App_Table_View(container);
  }

  get list(){ return this._list; }
  get size(){ return Object.keys(this._list).length; }

  process(data, instance, update_view = false)
  {
    this._list = {};
    Object.values(data.data).forEach(app => this._list[app.name] = new App(app));

    update_view && this.update_view();
  }

  /**
   * View
   */
   update_view()
   {
     this._view.update(this);
   }
}

class App_Table_View
{
  constructor(container)
  {
    this._container = container;
  }

  update(model)
  {
    if(!model.size)
    {
      this._container.innerHTML = '<tr><td colspan=20><em>No app uploaded</em></td></tr>'
      return;
    }

    this._container.innerHTML = '';
    Object.values(model.list).forEach(app => {
        const line = document.createElement('tr');
        line.dataset.app = app.name;
        attr.forEach(a => {
          switch(a)
          {
            case 'hash':
              // col.textContent = app[a].slice(-6);
              // col.title = app[a];
              // break;
            case 'description':
            case 'uploader':
            case 'date_upload':
              break;
            default:
              const col = document.createElement('td');
              col.textContent = app[a];
              line.appendChild(col);
              break;
          }
        });
        const download = document.createElement('td');
        download.innerHTML = '<i class="fas fa-file-download app-download"></i>'
        download.title = 'Download app';
        download.classList.add('app-download');
        line.appendChild(download);

        const close = document.createElement('td');
        close.innerHTML = '&times;';
        close.title = 'Delete app';
        close.classList.add('app-close');
        line.appendChild(close);

        this._container.appendChild(line);
    });
  }
}


const template_detail = document.createElement('template');
template_detail.innerHTML = app_detail_html;

export class App_Detail_View{
  constructor(container, instance)
  {
    const temp = template_detail.content.firstElementChild.cloneNode(true);

    this._name = temp.querySelector('.detail-title');
    this._id = temp.querySelector('.detail-id');
    this._version = temp.querySelector('.detail-version');
    this._size = temp.querySelector('.detail-size');
    this._hash = temp.querySelector('.detail-hash');
    this._description = temp.querySelector('.detail-description');
    this._uploader = temp.querySelector('.detail-uploader');
    this._date_upload = temp.querySelector('.detail-upload-date');

    temp.querySelector('.detail-edit-description')
      .addEventListener('click', ev => {
        this._description.contentEditable = true;
        this._description.focus();
      });

    this._description.addEventListener('blur', ev => {
      this._description.contentEditable = false;
      instance.send(message_types.APP, app_commands.EDIT, {
        name: this._name.textContent,
        description: this._description.innerText
      })
    })

    container.innerHTML = '';
    container.appendChild(temp);
  }

  update(app)
  {
    attr.forEach(a => {
      switch(a)
      {
        case 'date_upload':
          this[`_${a}`].textContent = format_date_time(new Date(app[a] * 1000));
          break;
        case 'description':
          this[`_${a}`].innerText = app[a];
          break;
        default:
          this[`_${a}`].textContent = app[a];
          break;
      }
    });
  }
}

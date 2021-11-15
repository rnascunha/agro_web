import image_detail_html from '../containers/main/image_detail.html'
import {format_date_time} from '../helper/date_format.js'
import {message_types,
        image_commands} from '../messages/types.js'

const attr = ['id', 'name', 'version', 'size', 'project',
              'time', 'date', 'idf_version', 'hash', 'magic_number',
              'secure_version', 'description', 'uploader', 'date_upload']

class Image{
  constructor({id, name, hash, magic_number,
              project, secure_version, size,
              time, date, version, idf_version,
            description, uploader, date_upload})
  {
    this._id = id;
    this._name = name;
    this._hash = hash;
    this._magic_number = magic_number;
    this._project = project;
    this._secure_version = secure_version;
    this._size = size;
    this._time = time;
    this._date = date;
    this._version = version;
    this._idf_version = idf_version;
    this._description = description;
    this._uploader = uploader;
    this._date_upload = date_upload;
  }

  get id(){ return this._id; }
  get name(){ return this._name; }
  get hash(){ return this._hash; }
  get magic_number(){ return this._magic_number; }
  get project(){ return this._project; }
  get secure_version(){ return this._secure_version; }
  get size(){ return this._size; }
  get time(){ return this._time; }
  get date(){ return this._date; }
  get version(){ return this._version; }
  get idf_version(){ return this._idf_version; }
  get description(){ return this._description; }
  get uploader(){ return this._uploader; }
  get date_upload(){ return this._date_upload; }
}

export class Image_List{
  constructor(container)
  {
    this._list = {};
    this._view = new Image_Table_View(container);
  }

  get list(){ return this._list; }
  get size(){ return Object.keys(this._list).length; }

  exist(name)
  {
    return name in this._list;
  }

  process(data, instance, update_view = false)
  {
    this._list = {};
    data.data.forEach(image => this._list[image.name] = new Image(image));

    if(update_view)
    {
      this.update_view();
    }
  }

  /**
   * view
   */

   update_view()
   {
     this._view.update(this);
   }
}

class Image_Table_View
{
  constructor(container)
  {
    this._container = container;
  }

  update(model)
  {
    if(!model.size)
    {
      this._container.innerHTML = `<tr>
        <td colspan=20>
          <em>No images uploaded</em>
        </td>
      </tr>`;
      return;
    }

    this._container.innerHTML = '';
    Object.values(model.list)
      .sort(function(a,b){ return a.id - b.id; })
      .forEach(image => {
        const line = document.createElement('tr');
        line.dataset.image = image.name;
        attr.forEach(a => {
          switch(a)
          {
            case 'project':
            case 'time':
            case 'date':
            case 'hash':
              // col.textContent = image[a].slice(-6);
              // col.title = image[a];
              // break;
            case 'magic_number':
            case 'secure_version':
            case 'description':
            case 'uploader':
            case 'date_upload':
            case 'idf_version':
              break;
            default:
              const col = document.createElement('td');
              col.textContent = image[a];
              line.appendChild(col);
              break;
          }
        });
        const download = document.createElement('td');
        download.innerHTML = '<i class="fas fa-file-download image-download"></i>'
        download.title = 'Download image';
        download.classList.add('image-download');
        line.appendChild(download);

        const close = document.createElement('td');
        close.innerHTML = '&times;';
        close.title = 'Delete image';
        close.classList.add('image-close');
        line.appendChild(close);

        this._container.appendChild(line);
    });
  }
}

const template_detail = document.createElement('template');
template_detail.innerHTML = image_detail_html;

export class Image_Detail_View{
  constructor(container, instance)
  {
    const temp = template_detail.content.firstElementChild.cloneNode(true);

    this._name = temp.querySelector('.detail-title');
    this._id = temp.querySelector('.detail-id');
    this._version = temp.querySelector('.detail-version');
    this._size = temp.querySelector('.detail-size');
    this._project = temp.querySelector('.detail-project');
    this._time = temp.querySelector('.detail-time');
    this._date = temp.querySelector('.detail-date');
    this._idf_version = temp.querySelector('.detail-idf-version');
    this._hash = temp.querySelector('.detail-hash');
    this._magic_number = temp.querySelector('.detail-magic-word');
    this._secure_version = temp.querySelector('.detail-secure-version');
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
      instance.send(message_types.IMAGE, image_commands.EDIT, {
        name: this._name.textContent,
        description: this._description.innerText
      })
    })

    container.innerHTML = '';
    container.appendChild(temp);
  }

  update(image)
  {
    attr.forEach(a => {
      switch(a)
      {
        case 'date_upload':
          this[`_${a}`].textContent = format_date_time(new Date(image[a] * 1000));
          break;
        case 'description':
          this[`_${a}`].innerText = image[a];
          break;
        default:
          this[`_${a}`].textContent = image[a];
          break;
      }
    });
  }
}

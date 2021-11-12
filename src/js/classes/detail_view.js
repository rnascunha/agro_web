export class Detail_View
{
  constructor()
  {
    this._detail = document.querySelector('#detail-container');
    this._content = this._detail.querySelector('#detail-content');
    this._close = this._detail.querySelector('.detail-close');

    this._close_cb = {};
    this._close_args = {};

    this._close.addEventListener('click', ev => {
      this.hide();
    })
  }

  get container(){ return this._detail; }
  get content(){ return this._content; }
  get close(){ return this._close; }

  show()
  {
    this._detail.classList.add('show-container');
  }

  hide()
  {
    this._detail.classList.remove('show-container');
    this.clear();
  }

  clear()
  {
    Object.entries(this._close_cb).forEach(([n,f]) => {
      f(...this._close_args[n]);

      delete this._close_cb[name];
      delete this._close_args[name];
    });
  }

  register_close(name, callback, ...args)
  {
    this._close_cb[name] = callback;
    this._close_args[name] = args;
  }
}

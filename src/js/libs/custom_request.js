
export class Custom_Request{
  constructor(container)
  {
    this._type = container.querySelector('.custom-request-type');
    this._made = container.querySelector('.custom-request-made');
    this._payload = container.querySelector('.custom-request-payload');
    this._path = container.querySelector('.custom-request-path');

    container.querySelector('.custom-request-button')
      .addEventListener('click', ev => {
        if(this._type.selectedIndex == 0)
        {
          this._made.textContent = 'Error! Request \'type\' not set';
          return;
        }

        const arg = this._split_path();
        container.dispatchEvent(new CustomEvent('command', {
          bubbles: true,
          detail: {
            type: 'custom',
            method: this._type.selectedOptions[0].value,
            resource: arg.path,
            query: arg.query,
            payload: this._payload.value
          }
        }));
        this._made.textContent = `${this._type.selectedOptions[0].value}: ${this._path.value.trim()} [${this._payload.value.length}]`;
      });
  }

  _split_path()
  {
    let [path, query] = this._path.value.trim().split('?');
    return {
            path: path.split('/').filter(p => p.length),
            query: !query ? [] : query.split('&').filter(q => q.length)
          };
  }
}

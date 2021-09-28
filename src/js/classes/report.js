import {active_shine} from '../helper/effect.js'

const template = document.createElement('template');
template.innerHTML = `<div id=report-history-content>
  <h1>Report History</h1>
  <!-- <div id=report-history-switch-container>
    <span class=report-switch-line data-report=info>
      <span slot=name>Info</span>
      <check-switch></check-switch>
    </span>
    <span class=report-switch-line data-report=success>
      <span>Success</span>
      <check-switch></check-switch>
    </span>
    <span class=report-switch-line data-report=warning>
      <span>Warning</span>
      <check-switch checked></check-switch>
    </span>
    <span class=report-switch-line data-report=error>
      <span>Error</span>
      <check-switch checked></check-switch>
    </span>
  </div> -->
  <div id=report-history-table-container>
    <table>
      <thead>
        <tr><th>Time</th><th>Type</th><th>Report</th></tr>
      </thead>
      <tbody>
        <tr><td colspan=3><em>No reports yet!</em></td></tr>
      </tbody>
    </table>
  </div>
</div>`;

function pad(num, size){ return ('000000000' + num).substr(-size); }

export class Report{
  constructor(container, pop_container)
  {
    this._list = [];
    this._container = container;

    this._pop_container = pop_container;
    this._pop_text = pop_container.querySelector('span');

    this.init_view();
    this._inner_container = container.querySelector('#report-history-table-container');
    this._tbody = container.querySelector('tbody');
  }

  add(report, update_view = false)
  {

    if(!this._list.length && (!Array.isArray(report) || (Array.isArray(report) && report.length)))
    {
        this.clear_view();
    }

    if(Array.isArray(report))
      this._list = this._list.concat(report)
    else
      this._list.push(report);

    if(update_view)
    {
      this.update_view(report);
    }
  }

  /**
   * View
   */
   clear_view()
   {
     this._tbody.innerHTML = '';
   }

   init_view(container)
   {
     this._container.addEventListener('cancel', ev => {
       this.hide();
     });

     this._container.appendChild(template.content.cloneNode(true));

     this._pop_container
      .querySelector('#report-pop-close')
      .addEventListener('click', ev => {
        this._pop_container.style.display = 'none';
      });
   }

   update_view(report)
   {
     if(Array.isArray(report))
     {
       report.forEach(r => this._update_line(r));
       return;
     }
     this._update_line(report);
     this._update_pop(report);
   }

   show()
   {
     this._container.show();
     //Auto scroll;
     this._inner_container.scrollTop = this._inner_container.scrollHeight;
   }

   hide()
   {
     this._container.hide();
   }

   _update_line(report)
   {
     const line = document.createElement('tr'),
          time = document.createElement('td'),
          type = document.createElement('td'),
          message = document.createElement('td'),
          fmsg = this._make_message(report);

      const date = ('time' in report) ? new Date(report.time) : new Date();
      time.textContent = `${date.getHours()}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}.${pad(date.getMilliseconds(), 3)}`
      type.textContent = report.type;
      message.textContent = fmsg;

      line.appendChild(time);
      line.appendChild(type);
      line.appendChild(message);

      line.classList.add(`report-${report.type}`);

      this._tbody.appendChild(line);
   }

   _update_pop(report)
   {
     const fmsg = this._make_message(report);

     this._pop_container.classList.remove('report-error',
                                         'report-warning',
                                         'report-success',
                                         'report-info');
     this._pop_text.textContent = fmsg;
     this._pop_container.classList.add(`report-${report.type}`);
     this._pop_container.style.display = 'block';

     //Adding shine effect
     active_shine(this._pop_container);
   }

   _make_message(data)
   {
     let msg = '';
     if('device' in data)
     {
       msg = `[${data.device}]: `;
     }
     msg += data.message;

     if('arg' in data)
     {
       msg += ` [${data.arg}]`;
     }

     return msg;
   }
}

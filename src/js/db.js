import {Storage} from "./libs/storage.js";

const db_name = 'agro';
const db_version = 1;
const db_scheme = [
    {name: 'sessions', options: { autoIncrement : true }}
];

// const storage = new Storage(db_name, db_version, db_scheme).on_open(() => {
//     storage.iterate('jobs', null, 'next', cursor => {
//       const job = job_list.add_job(cursor.value.index,
//         {
//           select: cursor.value.selected,
//           name: cursor.value.name,
//           time_init: cursor.value.time_init,
//           time_end: cursor.value.time_end,
//           priority: cursor.value.priority,
//           weekday: cursor.value.dow,
//           active: cursor.value.active
//         });
//
//       add_job_table(job);
//       return true;
//     });
//   });

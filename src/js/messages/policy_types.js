export const policy_types = {
  user_admin: 1 << 0,
	view_device: 1 << 1,
  edit_device: 1 << 2,
	get_resource: 1 << 3,
	post_resource: 1 << 4,
	put_resource: 1 << 5,
	delete_resource: 1 << 6,
	view_image: 1 << 7,
	upload_image: 1 << 8,
	install_image: 1 << 9,
	upload_app: 1 << 10,
	install_app: 1 << 11
}
Object.freeze(policy_types);

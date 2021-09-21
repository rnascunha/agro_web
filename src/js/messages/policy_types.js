export const policy_types = {
  user_admin: 1 << 0,
	view_device: 1 << 1,
	get_resource: 1 << 2,
	post_resource: 1 << 3,
	put_resource: 1 << 4,
	delete_resource: 1 << 5,
	view_image: 1 << 6,
	upload_image: 1 << 7,
	install_image: 1 << 8,
	upload_app: 1 << 9,
	install_app: 1 << 10
}
Object.freeze(policy_types);

export async function POST() {
	return Response.json({ error: 'Revalidation is not configured yet' }, { status: 501 });
}

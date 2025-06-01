import slugify from 'slugify'

export async function generateUniqueSlug(name, Model, currentId = null) {
  let baseSlug = slugify(name, { lower: true, strict: true })
  let slug = baseSlug
  let suffix = 1

  let slugExists = await Model.findOne({
    slug,
    _id: { $ne: currentId },
  })

  while (slugExists) {
    slug = `${baseSlug}-${suffix}`
    slugExists = await Model.findOne({
      slug,
      _id: { $ne: currentId },
    })
    suffix++
  }

  return slug
}

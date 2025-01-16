export function defineAction(check) {
  const fields = foundry.data.fields;

  return new fields.SchemaField({
    check: new fields.StringField({
      initial: check,
      nullable: true,
      choices: Object.keys(pf1rs.config.orgChecks),
    }),
  });
}

/**
 * Default model settings
 * (sails.config.models)
 *
 * Your default, project-wide model settings. Can also be overridden on a
 * per-model basis by setting a top-level properties in the model definition.
 *
 * For details about all available model settings, see:
 * https://sailsjs.com/config/models
 *
 * For more general background on Sails model settings, and how to configure
 * them on a project-wide or per-model basis, see:
 * https://sailsjs.com/docs/concepts/models-and-orm/model-settings
 */

module.exports.models = {
  migrate: "alter",

  attributes: {
    createdAt: { type: "number", autoCreatedAt: true },
    updatedAt: { type: "number", autoUpdatedAt: true },
    id: { type: "number", autoIncrement: true },
    //--------------------------------------------------------------------------
    //  /\   Using MongoDB?
    //  ||   Replace `id` above with this instead:
    //
    // ```
    // id: { type: 'string', columnName: '_id' },
    // ```
    //
    // Plus, don't forget to configure MongoDB as your default datastore:
    // https://sailsjs.com/docs/tutorials/using-mongo-db
    //--------------------------------------------------------------------------
  },

  /******************************************************************************
   *                                                                             *
   * The set of DEKs (data encryption keys) for at-rest encryption.              *
   * i.e. when encrypting/decrypting data for attributes with `encrypt: true`.   *
   *                                                                             *
   * > The `default` DEK is used for all new encryptions, but multiple DEKs      *
   * > can be configured to allow for key rotation.  In production, be sure to   *
   * > manage these keys like you would any other sensitive credential.          *
   *                                                                             *
   * > For more info, see:                                                       *
   * > https://sailsjs.com/docs/concepts/orm/model-settings#?dataEncryptionKeys  *
   *                                                                             *
   ******************************************************************************/

  dataEncryptionKeys: {
    default: "nw+FApd7X/A1IyhkTXrXNG80TJpaAcsNYKlMfzQfjvM=",
  },

  /***************************************************************************
   *                                                                          *
   * Whether or not implicit records for associations should be cleaned up    *
   * automatically using the built-in polyfill.  This is especially useful    *
   * during development with sails-disk.                                      *
   *                                                                          *
   * Depending on which databases you're using, you may want to disable this  *
   * polyfill in your production environment.                                 *
   *                                                                          *
   * (For production configuration, see `config/env/production.js`.)          *
   *                                                                          *
   ***************************************************************************/

  cascadeOnDestroy: true,
};

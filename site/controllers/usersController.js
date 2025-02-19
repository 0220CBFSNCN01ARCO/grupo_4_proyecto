const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcrypt');
const saltNumber = 10;
const db = require('../database/models');
const { User }  = require('../database/models');

let usersController = {
    userRegister: function(req, res, next) {
        res.render('register', {
            title: 'iChef - Registro',
            subtitle: 'Registro usuario',
            usuario: req.session.usuarioLogueado,
            itemCart: req.session.cart
        });
    },
    createUser: async function(req, res, next) {
        let errores = validationResult(req);
        //console.log("file",req.file);

        let datosForm = {
            nombre: req.body.nombreUser,
            apellido: req.body.apellidoUser,
            email: req.body.emailUser.toLowerCase(),
            password: bcrypt.hashSync(req.body.passwordUser, saltNumber),
            nroTelefono: req.body.nroTelefonoUser,
        };
        if(req.file) {
            if (errores.isEmpty()) {
                if (req.body.passwordUser != req.body.repeatPasswordUser) {
                    return res.render('register', {
                        title: 'iChef - Registro',
                        errores: [{
                            value: '',
                            msg: 'Las contraseñas no coinciden.',
                            param: 'passwordUser',
                            location: 'body'
                        }]
                    });
                } else {
                    try {
                        const usuarioFind = await db.User.findOne({ where: { email: req.body.emailUser } });
                        //console.log(usuarioFind);
                        if (usuarioFind instanceof db.User) {
                            return res.render('register', {
                                title: 'iChef - Registro',
                                errores: [{
                                    value: '',
                                    msg: 'El email ingresado ya existe.',
                                    param: 'emailUser',
                                    location: 'body'
                                }]
                            });
                        } else {
                            const newUsuario = await db.User.create({
                                nombre: req.body.nombreUser,
                                apellido: req.body.apellidoUser,
                                email: req.body.emailUser.toLowerCase(),
                                password: bcrypt.hashSync(req.body.passwordUser, saltNumber),
                                nroTelefono: req.body.nroTelefonoUser,
                                avatar: req.file.filename,
                                categorie_id: 4
                            });
                            //console.log("new: ",newUsuario);
                            if (newUsuario instanceof db.User) {
                                //return res.redirect(301, '/login' );
                                return res.render('userMsg', {
                                    title: 'Usuario',
                                    tipo: 'success',
                                    mensaje: newUsuario.nombre,
                                    errores: errores.errors,
                                    usuario: req.session.usuarioLogueado
                                });
                            }
                        }
                    } catch (error) {
                        //console.log(error);
                        return res.render('errordb', {
                            title: 'Error',
                            error: error,
                            usuario: req.session.usuarioLogueado
                        });
                    }
                }
            } else {
                return res.render('register', {
                    title: 'iChef - Registro',
                    errores: errores.errors
                });
            }
        }else {
            let errorFoto = {  value: '',
            msg: 'Debe seleccionar una foto.',
            param: 'fotoPerfil',
            location: 'body'};
            errores.errors.push(errorFoto);

            return res.render('register', {
                title: 'iChef - Registro',
                datosForm,
                errores: errores.errors
            });

        }

    },
    userLogin: function(req, res, next) {
        return res.render('login', {
            title: 'iChef - Login',
            usuario: req.session.usuarioLogueado,
            itemCart: req.session.cart
        });
    },
    loguearUsuario: async function(req, res, next) {
        let errores = validationResult(req);
        //console.log(errores);
        //console.log("loguear usuario");
        if (errores.isEmpty()) {
            try {
                const usuarioLoguear = await db.User.findOne({ where: { email: req.body.emailUsuario } });
                //console.log("Usuario loguear: ",usuarioLoguear);
                if (!usuarioLoguear) {
                    return res.render('login', {
                        title: 'iChef - Login',
                        errores: [{
                            value: '',
                            msg: 'El email ingresado no existe.',
                            param: 'emailUsuario',
                            location: 'body'
                        }],
                        emailIngresado: req.body.emailUsuario,
                        usuario: req.session.usuarioLogueado,
                        itemCart: req.session.cart
                    });
                } else {
                    //console.log(usuarioLoguear);
                    if (bcrypt.compareSync(req.body.passwordUsuario, usuarioLoguear.password)) {
                        req.session.usuarioLogueado = {
                                                id: usuarioLoguear.id,
                                                categorie_id: usuarioLoguear.categorie_id,
                                                mail: usuarioLoguear.email,
                                                nombre: usuarioLoguear.nombre,
                                                apellido: usuarioLoguear.apellido,
                                                avatar: usuarioLoguear.avatar
                                            };
                        if (req.body.checkRecordame) {
                            console.log("Se recuerda usuario.");
                            res.cookie('recordame', usuarioLoguear.email, { maxAge: 120000 })
                        }
                        //console.log("Usuario session: ", req.session.usuarioLogueado);
                        return res.redirect(301, '/');
                    } else {
                        return res.render('login', {
                            title: 'Login',
                            errores: [{
                                value: '',
                                msg: 'Contraseña incorrecta.',
                                param: 'passwordUsuario',
                                location: 'body'
                            }],
                            emailIngresado: req.body.emailUsuario,
                            usuario: req.session.usuarioLogueado,
                            itemCart: req.session.cart
                        });
                    }
                }
            } catch (error) {
                //console.log(error);
                return res.render('login', {
                    title: 'Login',
                    errores: [{
                        value: '',
                        msg: 'Error al validar usuario.',
                        param: 'passwordUsuario',
                        location: 'body'
                    }],
                    emailIngresado: req.body.emailUsuario,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            }
        } else {
            return res.render('login', {
                title: 'Login',
                errores: errores.errors
            });
        }
    },
    userList: function(req, res, next) {
        db.User.findAll({
                include: [{ association: "categoriaUsuario" },
                    { association: "estadoUsuario" }
                ]
            })
            .then(function(usuarios) {
                return res.render('usersList', {
                    title: 'iChef - Usuarios',
                    usuarios: usuarios,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            }).catch(function(error) {
                //console.log(error);
                return res.render('errordb', {
                    title: 'Error',
                    error: error,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            });
    },
    logoutUser: function(req, res, next) {
        sessionData = req.session;
        sessionData.destroy(function(err) {
            if (err) {
                msg = 'Error destroy session';
                res.render('error', {
                    title: 'Error',
                    usuario: req.session.usuarioLogueado
                });
            } else {
                res.clearCookie('recordame');
                return res.redirect('/');
            }
        });
    },
    userProfile: async function(req, res, next) {
        //console.log("parametro id: ",req.params.id);
        try {
            const userPro = await db.User.findByPk(req.params.id);
            if (userPro) {
                return res.render('userProfile', {
                    title: 'iChef - Perfil usuario',
                    usuarioEdit: userPro,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            }
        } catch (error) {
            return res.render('errordb', {
                title: 'Error',
                error: error,
                usuario: req.session.usuarioLogueado,
                itemCart: req.session.cart
            });
        }
    },
    userEdit: async function(req, res, next) {
        try {
            const userEdit = await db.User.findByPk(req.params.id);
            //console.log("Usuario edit: ", userEdit);
            const roles = await db.UserCategorie.findAll({
                order: [['descripcion', 'ASC']]});
            const estados = await db.UserStatus.findAll({
                order: [['descripcion', 'ASC']]});
            let datosForm = {
                id: userEdit.id,
                nombre: userEdit.nombre,
                apellido: userEdit.apellido,
                email: userEdit.email,
                nroTelefono: userEdit.nroTelefono,
                avatar: userEdit.avatar,
                categorie_id: userEdit.categorie_id,
                estado: userEdit.estado
            };
            //console.log("User edit: ", userEdit);
            if (userEdit) {
                return res.render('userAdd', {
                    title: 'iChef - Edición usuario',
                    roles,
                    estados,
                    edicion: 1,
                    datosForm,
                    usuario: req.session.usuarioLogueado
                });
            }
        } catch (error) {
            return res.render('errordb', {
                title: 'Error',
                error: error,
                usuario: req.session.usuarioLogueado,
                itemCart: req.session.cart
            });
        }
    },
    updateUser: function(req, res, next) {
        console.log("imagen usuario", req.files)
        console.log("imagen", req.file)
        console.log("body", req.body)

        db.User.update({
                nombre: req.body.nombreUser,
                apellido: req.body.apellidoUser,
                email: req.body.emailUser,
                nroTelefono: req.body.nroTelefonoUser
                    //avatar: req.file.filename
            }, {
                where: {
                    id: req.params.id
                }
            })
            .then(function(usuarioEdit) {
                //console.log(usuarioEdit)
                return res.redirect(301, 'userAccount');
            })
            .catch(function(error) {
                //console.log(error);
                return res.render('errordb', {
                    title: 'Error',
                    error: error,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            });
    },
    deleteUserById: async function(req, res, next) {
        try {
            const UserDelete = await User.findByPk(req.params.idUser);
            //console.log("Usuario a eliminar: ", UserDelete);
            UserDelete.estado = 4;
            await UserDelete.save();
            return res.redirect(301, '/users');
        } catch (error) {
            console.log(error)
        }

    },
    changePassword: function(req, res, next) {
        db.User.findByPk(req.params.id)
            .then(function(usuarioEdit) {
                return res.render('changePassword', {
                    title: 'iChef - Contraseña',
                    usuarioEdit: usuarioEdit,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            })
            .catch(function(error) {
                return res.render('errordb', {
                    title: 'Error',
                    error: error,
                    usuario: req.session.usuarioLogueado
                });
            });
    },
    updatePassword: async function(req, res, next) {
        let errores = validationResult(req);
        console.log(errores)
        if (errores.isEmpty()) {
            try {
                let usuario = await db.User.findByPk(req.params.id);
                let checkPass = bcrypt.compareSync(req.body.passwordUser, usuario.password);
                if (!checkPass) {
                    return res.render('changePassword', {
                        title: 'iChef - Cambiar contraseña',
                        usuarioEdit: usuario,
                        errores: [{
                            value: '',
                            msg: 'Las contraseña anterior no coincide.',
                            param: 'passwordUser',
                            location: 'body'
                        }],
                        usuario: req.session.usuarioLogueado
                    });
                } else {
                    if (req.body.passwordUserNew != req.body.repeatPasswordUserNew) {
                        return res.render('changePassword', {
                            title: 'Cambiar contraseña',
                            usuarioEdit: usuario,
                            errores: [{
                                    value: '',
                                    msg: 'Las contraseñas no coinciden.',
                                    param: 'passwordUserNew',
                                    location: 'body'
                                },
                                {
                                    value: '',
                                    msg: 'Las contraseñas no coinciden.',
                                    param: 'repeatPasswordUserNew',
                                    location: 'body'
                                }
                            ],
                            usuario: req.session.usuarioLogueado
                        });
                    } else {
                        let newPasswor = bcrypt.hashSync(req.body.passwordUser, saltNumber);
                        db.User.update({ password: newPasswor }, {
                                where: {
                                    id: req.params.id
                                }
                            })
                            .then(function(usuarioEdit) {
                                return res.redirect(301, 'userAccount');
                            })
                            .catch(function(error) {
                                return res.render('errordb', {
                                    title: 'Error',
                                    error: error,
                                    usuario: req.session.usuarioLogueado
                                });
                            });
                    }
                }
            } catch (error) {
                return res.render('errordb', {
                    title: 'Error',
                    error: error,
                    usuario: req.session.usuarioLogueado
                });
            }
        } else {
            return res.render('changePassword', {
                title: 'Cambiar contraseña',
                errores: errores.errors,
                usuario: req.session.usuarioLogueado
            });
        }
    },
    userAccount: function(req, res, next) {
        //console.log(req.session.usuarioLogueado.id);
        db.User.findByPk(req.params.id)
            .then(function(usuarioEdit) {
                return res.render('userAccount', {
                    title: 'iChef - Cuenta usuario',
                    usuarioEdit: usuarioEdit,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            })
            .catch(function(error) {
                return res.render('errordb', {
                    title: 'Error',
                    error: error,
                    usuario: req.session.usuarioLogueado,
                    itemCart: req.session.cart
                });
            });
    },
    userAdd: async function(req, res, next) {
        try {
            const roles = await db.UserCategorie.findAll({
                order: [['descripcion', 'ASC']]});
            const estados = await db.UserStatus.findAll({
                order: [['descripcion', 'ASC']]});
            return res.render('userAdd', {
                title: 'iChef - Alta usuario',
                subtitle: 'Alta usuario',
                roles,
                alta: 1,
                estados,
                usuario: req.session.usuarioLogueado
            });
        } catch (error) {
            console.log("Error userAdd:", error);
        }
    },
    saveEdit: async function(req, res, next) {
        let errores = validationResult(req);
        //console.log("Errores: ",errores);
        console.log('Foto: ', req.file)
        let idUser = req.params.id;
        let datosForm = {
            id: idUser,
            nombre: req.body.nombreUser,
            apellido: req.body.apellidoUser,
            email: req.body.emailUser.toLowerCase(),
            nroTelefono: req.body.nroTelefonoUser,
            categorie_id: req.body.rolUser,
            estado: req.body.estadoUsr
        };

        if (errores.isEmpty()) {
            try {
                let fotoperfil;
                if (!req.file) {
                    fotoperfil = 'default-user.png'
                } else {
                    fotoperfil = req.file.filename
                }
                const newUser = await db.User.update({
                    nombre: req.body.nombreUser,
                    apellido: req.body.apellidoUser,
                    email: req.body.emailUser.toLowerCase(),
                    nroTelefono: req.body.nroTelefonoUser,
                    avatar: fotoperfil,
                    categorie_id: req.body.rolUser,
                    estado: req.body.estadoUsr
                }, { where: { id: idUser }});
                return res.redirect(301, '/users')
            } catch (error) {
                console.log("Error userSave:", error);
            }
        } else {
            //console.log("Body: ",req.body);
            try {
                const roles = await db.UserCategorie.findAll({
                    order: [['descripcion', 'ASC']]});
                const estados = await db.UserStatus.findAll({
                    order: [['descripcion', 'ASC']]});

                return res.render('userAdd', {
                    title: 'iChef - Alta usuario',
                    subtitle: 'Alta usuario',
                    roles,
                    estados,
                    datosForm,
                    errores: errores.errors,
                    usuario: req.session.usuarioLogueado
                });
            } catch (error) {
                console.log(error);
            }
        }

    },
    userSave: async function(req, res, next) {
        let errores = validationResult(req);
        //console.log("Errores: ",errores);
        console.log('Foto: ', req.file)
        let datosForm = {
            nombre: req.body.nombreUser,
            apellido: req.body.apellidoUser,
            email: req.body.emailUser.toLowerCase(),
            password: bcrypt.hashSync(req.body.passwordUser, saltNumber),
            nroTelefono: req.body.nroTelefonoUser,
            categorie_id: req.body.rolUser,
            estado: req.body.estadoUsr
        };

        if (errores.isEmpty()) {
            try {
                let fotoperfil;
                if (!req.file) {
                    fotoperfil = 'default-user.png'
                } else {
                    fotoperfil = req.file.filename
                }
                const newUser = await db.User.create({
                    nombre: req.body.nombreUser,
                    apellido: req.body.apellidoUser,
                    email: req.body.emailUser.toLowerCase(),
                    password: bcrypt.hashSync(req.body.passwordUser, saltNumber),
                    nroTelefono: req.body.nroTelefonoUser,
                    avatar: fotoperfil,
                    categorie_id: req.body.rolUser,
                    estado: req.body.estadoUsr
                });
                return res.redirect(301, '/users')
            } catch (error) {
                console.log("Error userSave:", error);
            }
        } else {
            //console.log("Body: ",req.body);
            try {
                const roles = await db.UserCategorie.findAll({
                    order: [
                        ['descripcion', 'ASC']
                    ]
                });
                const estados = await db.UserStatus.findAll({
                    order: [
                        ['descripcion', 'ASC']
                    ]
                });

                return res.render('userAdd', {
                    title: 'iChef - Alta usuario',
                    subtitle: 'Alta usuario',
                    roles,
                    estados,
                    datosForm,
                    errores: errores.errors,
                    usuario: req.session.usuarioLogueado
                });
            } catch (error) {
                console.log(error);
            }
        }


    }
};

module.exports = usersController;
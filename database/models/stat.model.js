import { Model, DataTypes } from 'sequelize';


export default function model(sequelize) {
	class Stat extends Model {
        static associate(models) {
        }
    }
	Stat.init(
	{
		videoCount: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
	},
	// Lo que está aqui abajo siempre va no cambiar, solo cambiar
	// el nombre de Modelname
	{
		underscored: true,
		// esto tiene que ir o si no intentará hacer selects en un campo createdAt
		// que no tenemos
		timestamps: false,
		sequelize,
		freezeTableName: true,
		modelName: 'stat',
	}
    );
	Stat.removeAttribute('id');
};
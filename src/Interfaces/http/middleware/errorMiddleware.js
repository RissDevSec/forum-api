import ClientError from '../../../Commons/exceptions/ClientError.js';
import DomainErrorTranslator from '../../../Commons/exceptions/DomainErrorTranslator.js';

// eslint-disable-next-line no-unused-vars
const errorMiddleware = async (err, req, res, next) => {
  // bila response tersebut error, tangani sesuai kebutuhan
  const translatedError = DomainErrorTranslator.translate(err);

  // penanganan client error secara internal.
  if (translatedError instanceof ClientError) {
    return res.status(translatedError.statusCode).json({
      status: 'fail',
      message: translatedError.message,
    });
  } else {
    console.error(err);
    return res.status(500).json({
      status: 'error',
      message: 'terjadi kegagalan pada server kami',
    });
  }

  // penanganan server error sesuai kebutuhan
};

export { errorMiddleware };

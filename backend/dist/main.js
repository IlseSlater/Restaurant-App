"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./suppress-http2-warning");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:4200',
            'https://localhost:4200',
            'http://127.0.0.1:4200',
            'https://192.168.50.204:4200',
            'https://127.0.0.1:4200',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Restaurant App API')
        .setDescription('API for Restaurant PWA App')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = class SupabaseService {
    config;
    client;
    constructor(config) {
        this.config = config;
        const url = this.config.get('SUPABASE_URL');
        const anonKey = this.config.get('SUPABASE_ANON_KEY');
        if (!url || !anonKey) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
        }
        this.client = (0, supabase_js_1.createClient)(url, anonKey);
    }
    getClient() {
        return this.client;
    }
    async uploadImage(bucket, path, file) {
        return await this.client.storage.from(bucket).upload(path, file, { upsert: true });
    }
    async getPublicUrl(bucket, path) {
        return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
    async getUserFromRequest(req) {
        const authHeader = req.headers['authorization'];
        if (!authHeader)
            return null;
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await this.client.auth.getUser(token);
        if (error)
            throw new Error('Invalid token');
        return data.user;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map
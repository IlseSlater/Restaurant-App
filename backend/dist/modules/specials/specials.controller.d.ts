import { SpecialsService, CreateSpecialDto, UpdateSpecialDto, EvaluateSpecialsDto } from './specials.service';
export declare class SpecialsController {
    private readonly specialsService;
    constructor(specialsService: SpecialsService);
    create(dto: CreateSpecialDto): Promise<any>;
    findAll(companyId: string, activeOnly?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateSpecialDto): Promise<any>;
    remove(id: string): Promise<any>;
    addItem(specialId: string, body: {
        menuItemId: string;
        isRequired?: boolean;
        sortOrder?: number;
    }): Promise<any>;
    removeItem(specialId: string, menuItemId: string): Promise<any>;
    evaluate(dto: EvaluateSpecialsDto): Promise<import("./specials.service").ActiveSpecial[]>;
}
